import * as cdk from '@aws-cdk/core';
import {StaticSite} from "./static-site";
import {ISource} from "@aws-cdk/aws-s3-deployment/lib/source";
import {BlogSource} from "./blog-source";

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    new StaticSite(this, 'StaticSite', {
      domainName: this.node.tryGetContext('domain'),
      siteSubDomain: this.node.tryGetContext('subdomain')
    });
  }
}

