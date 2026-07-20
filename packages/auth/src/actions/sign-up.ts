"use server";

import { createServerSupabaseClient } from "@travio/database/server";

import type { Database } from "@travio/database";

type RpcTest = Database["public"]["Functions"]["create_agency"]["Args"];

const testRpc: RpcTest = {
  agency_name: "test",
  agency_cr_number: "123",
};

type SignUpAgencyInput = {
  email: string;
  password: string;
  fullName: string;
  agencyName: string;
  crNumber: string;
};


export async function signUpAgency(
  input: SignUpAgencyInput
) {

 const supabase = await createServerSupabaseClient();

// type Rpc = Parameters<typeof supabase.rpc>[1];

type Functions = Database["public"]["Functions"];

type RpcKeys = keyof Functions;

const rpcName: RpcKeys = "create_agency";

 
 



  const {
    data,
    error,
  } = await supabase.auth.signUp({

    email: input.email,

    password: input.password,

    options: {
      data: {
        full_name: input.fullName,
        account_type: "agency",
      },
    },

  });


  if (error) {
    throw error;
  }


  if (!data.user) {
    throw new Error("User creation failed");
  }


  const {
  data: tenant,
  error: tenantError,
} = await (supabase as any).rpc(
  "create_agency",
  {
    agency_name: input.agencyName,
    agency_cr_number: input.crNumber,
  }
);


  if (tenantError) {
    throw tenantError;
  }


  return {
    user: data.user,
    tenant,
  };
}