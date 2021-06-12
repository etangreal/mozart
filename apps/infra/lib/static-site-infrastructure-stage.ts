import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { StaticSiteStack } from './static-site-stack';

/**
 * Deployable unit of web service app
 */
export class StaticSiteInfrastructureStage extends Stage {
    // public readonly urlOutput: CfnOutput;

    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        const staticSiteStack = new StaticSiteStack(this, 'StaticSite');

        // Expose CdkpipelinesDemoStack's output one level higher
        // this.urlOutput = service.urlOutput;
    }
}
