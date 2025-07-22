import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async () => {
  // 1. Get all listings
  const { data: listings, error: listingsError } = await supabase.from('listings').select('id');
  if (listingsError || !listings) return new Response('No listings', { status: 500 });

  for (const listing of listings) {
    // 2. Count orders for this listing
    const { count: rented_quantity, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listing.id);

    if (ordersError) continue;

    // 3. Upsert inventory row
    await supabase.from('inventory').upsert({
      listing_id: listing.id,
      listed_quantity: 1,
      rented_quantity: rented_quantity || 0,
      available_quantity: 1 - (rented_quantity || 0),
    });
  }

  return new Response('Inventory synced', { status: 200 });
}); 