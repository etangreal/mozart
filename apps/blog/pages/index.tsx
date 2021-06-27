import React from "react";
import Head from "next/head";

// import styled from "styled-components";

const title = "Next.js + TypeScript";

export function Index() {
  return (
    <div className="container">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">{title}</h1>
      </main>
    </div>
  );
}

export default Index;
