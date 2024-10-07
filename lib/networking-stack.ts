import { StackProps } from "aws-cdk-lib";
import StackExtender from "../extenders/StackExtender";
import { Construct } from "constructs";
import {
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";

const POSTGRES_PORT: number = 5432;

export class NetworkingStack extends StackExtender {
  public vpc: Vpc;
  public rdsSg: SecurityGroup;
  public isolatedSubnet = SubnetType.PRIVATE_ISOLATED;
  private privateSubnetWithIngress = SubnetType.PRIVATE_WITH_EGRESS;
  private publicSubnet = SubnetType.PUBLIC;

  constructor(scope: Construct, props?: StackProps) {
    super(scope, "Networking", props);

    this.vpc = this.createVpc(this.isProduction ? 2 : 1);

    const [lambdaSg, rdsSg, ecsSg] = ["Lambda", "Rds", "Ecs"].map((name) =>
      this.createAllTcpSecurityGroup(name)
    );

    rdsSg.addIngressRule(
      Peer.securityGroupId(lambdaSg.securityGroupId),
      Port.tcp(POSTGRES_PORT),
      "Allow Lambda to access RDS"
    );

    rdsSg.addIngressRule(
      Peer.securityGroupId(ecsSg.securityGroupId),
      Port.tcp(POSTGRES_PORT),
      "Allow ECS to access RDS"
    );

    this.rdsSg = rdsSg;
  }

  createVpc(natGateways: number) {
    return new Vpc(this, this.buildConstructName("Vpc"), {
      maxAzs: 2,
      natGateways,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: this.publicSubnet,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: this.privateSubnetWithIngress,
        },
        {
          cidrMask: 24,
          name: "Isolated",
          subnetType: this.isolatedSubnet,
        },
      ],
    });
  }

  private createAllTcpSecurityGroup(name: string) {
    const sg = new SecurityGroup(
      this,
      this.buildConstructName(`${name}SecurityGroup`),
      {
        vpc: this.vpc,
        allowAllOutbound: true,
        securityGroupName: this.buildConstructName(`${name}SecurityGroup`),
      }
    );

    sg.addIngressRule(Peer.anyIpv4(), Port.tcp(3306), name);
    return sg;
  }
}
