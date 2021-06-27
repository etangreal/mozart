import React from "react";
import { AppProps } from "next/app";

import "./global.css";

function CustomApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default CustomApp;
