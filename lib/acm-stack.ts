import StackExtender from "../extenders/StackExtender";
import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export class AcmStack extends StackExtender {
  constructor(scope: Construct, props: StackProps) {
    super(scope, "Acm", props);
  }

  
}
