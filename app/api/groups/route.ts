import { NextRequest, NextResponse } from "next/server";
import { createGroup, getAllGroups } from "@/lib/db/groups";
import { CreateGroupInput } from "@/lib/types/group";

// GET /api/groups - List all groups
export async function GET() {
  try {
    const groups = await getAllGroups();

    return NextResponse.json({
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        webhookUrls: g.webhookUrls,
        color: g.color,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API] Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const input: CreateGroupInput = {
      name: body.name,
      description: body.description,
      webhookUrls: body.webhookUrls || [],
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
          color: group.color,
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
