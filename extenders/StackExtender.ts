import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export default class StackExtender extends Stack {
  stack: string;
  isProduction: boolean;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.stack = `${scope.node.getContext("appName")}-${id}`;
    this.isProduction = scope.node.getContext("isProduction");
  }

  buildConstructName(construct: string) {
    return `${this.stack}${construct}`;
  }
}
