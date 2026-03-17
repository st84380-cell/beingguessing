import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yucarcuvfonsqxmdqfmy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_sT5SPgYOFBZAueCFfRHQxA_VQwfsfcH'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function loadRoom(code) {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('data')
      .eq('code', code)
      .single()
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

export async function saveRoom(code, roomData) {
  try {
    const { error } = await supabase
      .from('rooms')
      .upsert({ code, data: roomData, updated_at: new Date().toISOString() })
    return !error
  } catch {
    return false
  }
}
