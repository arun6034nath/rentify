import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get all listings
    const { data: listings, error: listingsError } = await supabase.from('listings').select('id, listed_quantity');
    if (listingsError) throw listingsError;
    if (!listings) return new Response('No listings found', { status: 404 });

    for (const listing of listings) {
      // Count "Ordered" orders for this listing
      const { count: rented_quantity, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listing.id)
        .eq('status', 'Ordered');

      if (ordersError) {
        console.error(`Error counting orders for listing ${listing.id}:`, ordersError.message);
        continue;
      }

      // Calculate available_quantity and available status
      const listed_quantity = listing.listed_quantity || 1;
      const available_quantity = listed_quantity - (rented_quantity || 0);
      const available = available_quantity > 0;

      // Update the listings table for the current listing
      const { error: updateError } = await supabase.from('listings').update({
        rented_quantity: rented_quantity || 0,
        available_quantity,
        available
      }).eq('id', listing.id);
      
      if (updateError) {
        console.error(`Error updating listing ${listing.id}:`, updateError.message);
      }
    }

    return new Response(JSON.stringify({ message: 'Listings synced successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 