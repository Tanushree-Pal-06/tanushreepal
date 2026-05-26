/**
 * DeskFlow - POST /api/tickets & GET /api/tickets
 * Author: Tanushree Pal | 0827AL231132 | tanushreepal230408@acropolis.in
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  computeDerivedFields,
  VALID_PRIORITIES,
  VALID_STATUSES,
  isEmailValid,
} from '@/lib/sla';

export async function POST(request) {
  try {
    const body = await request.json();
    const errors = [];

    if (!body.subject || typeof body.subject !== 'string' || !body.subject.trim()) {
      errors.push('subject is required and must be a non-empty string');
    }
    if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
      errors.push('description is required and must be a non-empty string');
    }
    if (!body.customer_email || !isEmailValid(body.customer_email)) {
      errors.push('customer_email is required and must be a valid email address');
    }
    if (!body.priority || !VALID_PRIORITIES.includes(body.priority)) {
      errors.push(`priority is required and must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        subject: body.subject.trim(),
        description: body.description.trim(),
        customer_email: body.customer_email.trim().toLowerCase(),
        priority: body.priority,
        status: body.status || 'open',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(computeDerivedFields(data), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const breached = searchParams.get('breached');

    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });

    if (status && VALID_STATUSES.includes(status)) {
      query = query.eq('status', status);
    }
    if (priority && VALID_PRIORITIES.includes(priority)) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let tickets = data.map(computeDerivedFields);

    if (breached === 'true') {
      tickets = tickets.filter((t) => t.slaBreached);
    }

    return NextResponse.json(tickets);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
