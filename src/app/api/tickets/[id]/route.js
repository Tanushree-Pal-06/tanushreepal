/**
 * DeskFlow - PATCH /api/tickets/[id] & DELETE /api/tickets/[id]
 * Author: Tanushree Pal | 0827AL231132 | tanushreepal230408@acropolis.in
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  computeDerivedFields,
  isValidTransition,
  VALID_STATUSES,
} from '@/lib/sla';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { error: 'status field is required for updates' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (existing.status === body.status) {
      return NextResponse.json(computeDerivedFields(existing));
    }

    if (!isValidTransition(existing.status, body.status)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from '${existing.status}' to '${body.status}'. Allowed transitions: ${existing.status} -> ${
            {
              open: ['in_progress'],
              in_progress: ['open', 'resolved'],
              resolved: ['in_progress', 'closed'],
              closed: ['resolved'],
            }[existing.status]?.join(', ') || 'none'
          }`,
        },
        { status: 400 }
      );
    }

    const updateData = { status: body.status };

    if (body.status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }
    if (existing.status === 'resolved' && body.status !== 'resolved' && body.status !== 'closed') {
      updateData.resolved_at = null;
    }

    const { data: updated, error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(computeDerivedFields(updated));
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Ticket deleted successfully', ticket: data });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
