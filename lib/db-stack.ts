import StackExtender from "../extenders/StackExtender";
import { StackProps } from "aws-cdk-lib";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  AuroraPostgresEngineVersion,
  ClusterInstance,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
} from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { DatabaseClusterProps, ProxyProps } from "../types";

interface DbStackProps extends StackProps {
  vpc: Vpc;
  rdsSg: SecurityGroup;
  subnetType: SubnetType;
}

export class DbStack extends StackExtender {
  private rdsSecretName: string = "mainRdsSecret";

  constructor(scope: Construct, props: DbStackProps) {
    super(scope, "Database", props);

    const { vpc, rdsSg, subnetType } = props;

    const cluster = this.createCluster({
      vpc,
      securityGroups: [rdsSg],
      subnetType,
    });
    // this.createProxy({ cluster, vpc, securityGroups: [rdsSg], subnetType });
  }

  private createCluster({
    vpc,
    securityGroups,
    subnetType,
  }: DatabaseClusterProps) {
    const engine = DatabaseClusterEngine.auroraPostgres({
      version: AuroraPostgresEngineVersion.VER_16_4,
    });

    const { writerInstance, readerInstances } =
      this.createRdsReaderWriterInstances();

    const credentials = Credentials.fromGeneratedSecret("RdsClusterSecret", {
      secretName: this.rdsSecretName,
    });

    return new DatabaseCluster(this, "RdsCluster", {
      clusterIdentifier: "main",
      defaultDatabaseName: "mydb",
      engine,
      vpc,
      vpcSubnets: { subnetType },
      writer: writerInstance,
      readers: readerInstances,
      credentials,
      securityGroups,
      deletionProtection: false,
      storageEncrypted: true,
    });
  }

  private createRdsReaderWriterInstances() {
    const writerClass = this.isProduction ? InstanceClass.R5 : InstanceClass.T3;
    const writerSize = this.isProduction
      ? InstanceSize.LARGE
      : InstanceSize.MEDIUM;

    const readerClass = this.isProduction ? InstanceClass.R5 : InstanceClass.T3;
    const readerSize = this.isProduction
      ? InstanceSize.LARGE
      : InstanceSize.MEDIUM;

    const writerInstanceType = InstanceType.of(writerClass, writerSize);
    const readerInstanceType = InstanceType.of(readerClass, readerSize);

    const writerInstance = ClusterInstance.provisioned("writer", {
      publiclyAccessible: true, // ONLY FOR TESTING
      instanceIdentifier: "writer",
      instanceType: writerInstanceType,
      enablePerformanceInsights: false,
    });

    const readerInstances = [
      ClusterInstance.provisioned("reader", {
        publiclyAccessible: true, // ONLY FOR TESTING
        instanceIdentifier: "reader",
        instanceType: readerInstanceType,
        enablePerformanceInsights: false,
      }),
    ];

    return { writerInstance, readerInstances };
  }

  private createProxy({
    vpc,
    cluster,
    securityGroups,
    subnetType,
  }: ProxyProps) {
    return cluster.addProxy("Proxy", {
      dbProxyName: this.buildConstructName("Proxy"),
      vpc,
      vpcSubnets: {
        subnetType,
      },
      secrets: [cluster.secret!],
      securityGroups,
    });
  }
}
