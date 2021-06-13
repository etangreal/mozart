import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { StaticSiteStack } from './static-site-stack';
import {ISource} from "@aws-cdk/aws-s3-deployment/lib/source";
import {BlogSource} from "./blog-source";


/**
 * Deployable unit of web service app
 */
export class StaticSiteInfrastructureStage extends Stage {
    // public readonly urlOutput: CfnOutput;

    constructor(scope: Construct, id: string, props: StageProps & BlogSource) {
        super(scope, id, props);

        const staticSiteStack = new StaticSiteStack(this, 'StaticSite', {...props});

        // Expose CdkpipelinesDemoStack's output one level higher
        // this.urlOutput = service.urlOutput;
    }
}
