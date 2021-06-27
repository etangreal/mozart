import React from "react";
import Head from "next/head";

import { Container, Main, BlogTitle } from "./index.styles";

const title = "Next.js + TypeScript";

export function Index() {
  return (
    <Container>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Main>
        <BlogTitle className="title">{title}</BlogTitle>
      </Main>
    </Container>
  );
}

export default Index;
