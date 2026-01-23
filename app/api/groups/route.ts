import { NextRequest, NextResponse } from "next/server";
import { createGroup, getAllGroups } from "@/lib/db/groups";
import { CreateGroupInput } from "@/lib/types/group";
import { getAuthUser } from "@/lib/auth/jwt";

// GET /api/groups - List all groups
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Allow all authenticated users to view groups
    const groups = await getAllGroups();

    return NextResponse.json({
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        webhookUrls: g.webhookUrls,
        alertEmails: g.alertEmails,
        color: g.color,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API] Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 },
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 },
      );
    }

    const input: CreateGroupInput = {
      name: body.name,
      description: body.description,
      webhookUrls: body.webhookUrls || [],
      alertEmails: body.alertEmails || [],
      color: body.color,
    };

    const group = await createGroup(input);

    return NextResponse.json(
      {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          webhookUrls: group.webhookUrls,
          alertEmails: group.alertEmails,
          color: group.color,
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API] Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 },
    );
  }
}
