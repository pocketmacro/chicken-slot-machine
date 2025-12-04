"use client";

import { useEffect } from "react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

export default function ConfigureAmplify() {
  useEffect(() => {
    Amplify.configure(outputs, { ssr: true });
  }, []);

  return null;
}
