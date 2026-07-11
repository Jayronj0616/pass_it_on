// Signed-URL helper for the private `chat-images` storage bucket (see
// supabase/migrations/0008_messages.sql). Unlike item-photos, this bucket
// is not public, so a raw path can't be turned into a viewable URL with
// getPublicUrl() — every render needs a short-lived signed URL instead.
// RLS on storage.objects (chat_images_select_participant) still applies:
// this will fail for anyone who isn't a participant on the inquiry, same
// as querying the messages row itself would.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour — plenty for a single chat session

export async function getSignedChatImageUrl(
  supabase: SupabaseClient<Database>,
  imagePath: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("chat-images")
    .createSignedUrl(imagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}
