import { createClient, type Session as SupabaseSession } from '@supabase/supabase-js'
import type { Item, Order, OrderItem, Profile } from '../types'
import { sortOrders, type Session, type Store } from './types'

const toNumber = (v: unknown): number | null => (v == null ? null : Number(v))

function toSession(s: SupabaseSession | null): Session | null {
  return s ? { userId: s.user.id, email: s.user.email ?? null } : null
}

export function createSupabaseStore(url: string, anonKey: string): Store {
  const supabase = createClient(url, anonKey, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
  })

  return {
    mode: 'supabase',

    async getSession() {
      const { data } = await supabase.auth.getSession()
      return toSession(data.session)
    },

    onSessionChange(callback) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(toSession(session)))
      return () => data.subscription.unsubscribe()
    },

    async sendMagicLink(email) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      })
      if (error) throw error
    },

    async signOut() {
      await supabase.auth.signOut()
    },

    async getAccessToken() {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token ?? null
    },

    async load() {
      const [profiles, items, orders] = await Promise.all([
        supabase.from('profiles').select('*').limit(1),
        supabase.from('items').select('*'),
        supabase.from('orders').select('*, items:order_items(*)'),
      ])
      for (const r of [profiles, items, orders]) if (r.error) throw r.error

      return {
        profile: (profiles.data?.[0] as Profile | undefined) ?? null,
        items: (items.data ?? []) as Item[],
        orders: sortOrders(
          (orders.data ?? []).map(
            (o): Order => ({
              ...o,
              total_rm: toNumber(o.total_rm),
              items: (o.items as OrderItem[]).map((l) => ({
                ...l,
                quantity: toNumber(l.quantity),
                amount_rm: toNumber(l.amount_rm),
              })),
            }),
          ),
        ),
      }
    },

    async saveProfile(input) {
      const { error } = await supabase.from('profiles').upsert(input, { onConflict: 'user_id' })
      if (error) throw error
    },

    async saveOrder(order) {
      const { data, error } = await supabase.rpc('save_order', { payload: order })
      if (error) throw error
      return data as string
    },
  }
}
