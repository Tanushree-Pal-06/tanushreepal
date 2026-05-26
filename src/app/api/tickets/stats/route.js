/**
 * DeskFlow - GET /api/tickets/stats
 * Author: Tanushree Pal | 0827AL231132 | tanushreepal230408@acropolis.in
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { computeDerivedFields } from '@/lib/sla';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const tickets = data.map(computeDerivedFields);

    const byStatus = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    let slaBreachedOpen = 0;

    tickets.forEach((t) => {
      if (byStatus[t.status] !== undefined) byStatus[t.status]++;
      if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
      if ((t.status === 'open' || t.status === 'in_progress') && t.slaBreached) {
        slaBreachedOpen++;
      }
    });

    return NextResponse.json({
      total: tickets.length,
      byStatus,
      byPriority,
      slaBreachedOpen,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
