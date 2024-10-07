import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { DatabaseCluster } from "aws-cdk-lib/aws-rds";

export interface DatabaseClusterProps {
  vpc: Vpc;
  securityGroups: SecurityGroup[];
  subnetType: SubnetType;
}

export interface ProxyProps extends DatabaseClusterProps {
  cluster: DatabaseCluster;
}
