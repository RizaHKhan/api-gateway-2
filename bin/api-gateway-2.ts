#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { NetworkingStack } from "../lib/networking-stack";
import { DbStack } from "../lib/db-stack";
import { env } from "process";

const { CDK_DEFAULT_ACCOUNT } = env;
const isProduction: boolean = false;
const app = new App({
  context: {
    isProduction,
    appName: "ApiGateway2",
    domainName: "modernartisans.xyz",
    env: { region: "us-east-1", account: CDK_DEFAULT_ACCOUNT },
  },
});

const networking = new NetworkingStack(app);

new DbStack(app, {
  vpc: networking.vpc,
  rdsSg: networking.rdsSg,
  subnetType: networking.isolatedSubnet,
});
