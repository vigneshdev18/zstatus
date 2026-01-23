import { NextRequest, NextResponse } from "next/server";
import { getGroupById, updateGroup, deleteGroup } from "@/lib/db/groups";
import { UpdateGroupInput } from "@/lib/types/group";

// GET /api/groups/[id] - Get group by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const group = await getGroupById(id);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("[API] Error fetching group:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 },
    );
  }
}

// PUT /api/groups/[id] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const input: UpdateGroupInput = {
      name: body.name,
      description: body.description,
      webhookUrls: body.webhookUrls,
      alertEmails: body.alertEmails,
      color: body.color,
    };

    const group = await updateGroup(id, input);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("[API] Error updating group:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 },
    );
  }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const success = await deleteGroup(id);

    if (!success) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 },
    );
  }
}
