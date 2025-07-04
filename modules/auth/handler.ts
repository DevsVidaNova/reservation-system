import supabase from "@/config/supabaseClient";
import { createSupabaseAnonClient } from "@/config/supabaseAnonClient";

// Handler: apenas lógica de acesso ao banco e manipulação de dados, sem Express

// Types auxiliares para os handlers de autenticação
type SignUpUserInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
};
type LoginUserInput = { email: string; password: string };
type UpdateUserProfileInput = { name: string; phone: string };

interface HandlerResult<T = any> {
  error?: any;
  [key: string]: any;
}

export async function signUpUserHandler({
  email,
  password,
  name,
  phone,
}: SignUpUserInput): Promise<HandlerResult<{ user: any }>> {
  // Verificar se já existe um usuário com este email
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existingProfile) {
    return { error: { message: "Já existe um usuário com este email." } };
  }

  const { data: user, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return { error };
  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .insert([
      {
        user_id: user.user?.id,
        name,
        phone,
        email,
        role: "user",
        is_admin: false,
      },
    ])
    .select();
  if (profileError) return { error: profileError };
  return { user, profile: profileData?.[0] };
}

export async function loginUserHandler({
  email,
  password,
}: LoginUserInput): Promise<HandlerResult<{ session: any; profile: any }>> {
  const userClient = createSupabaseAnonClient();
  const { data: session, error } = await userClient.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { error };
  const { data: profile, error: profileError } = await userClient
    .from("user_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single();
  if (profileError) return { error: profileError };
  return { session, profile };
}

export async function getUserProfileHandler(
  userId: string
): Promise<HandlerResult<{ profileData: any }>> {
  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (profileError || !profileData) {
    return { error: { message: "Usuário não encontrado." } };
  }
  
  return { profileData };
}

export async function updateUserProfileHandler(
  userId: string,
  { name, phone }: UpdateUserProfileInput
): Promise<HandlerResult<{ profile: any }>> {
  // Verificar se o usuário existe
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!existingProfile) {
    return { error: { message: "Usuário não encontrado." } };
  }

  const { data, error: updateError } = await supabase
    .from("user_profiles")
    .update({ name, phone, updated_at: new Date() })
    .eq("user_id", userId)
    .select();
  if (updateError) return { error: updateError };
  return { profile: data[0] };
}

export async function deleteUserHandler(
  userId: string
): Promise<HandlerResult<{ success: boolean }>> {
  // Verificar se o usuário existe antes de tentar deletar
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!existingProfile) {
    return { error: { message: "Usuário não encontrado." } };
  }

  const { error: profileError } = await supabase
    .from("user_profiles")
    .delete()
    .eq("user_id", userId);
  if (profileError) return { error: profileError };
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) return { error: authError };
  return { success: true };
}

export async function logoutHandler(): Promise<
  HandlerResult<{ success: boolean }>
> {
  const userClient = createSupabaseAnonClient();
  const { error } = await userClient.auth.signOut();
  if (error) return { error };
  return { success: true };
}
