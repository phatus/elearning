import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    const expectedSecret = process.env.WEBHOOK_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid webhook secret" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { event, data } = body;

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Missing event parameter" },
        { status: 400 }
      );
    }

    switch (event) {
      case "student.upsert": {
        if (!data || !data.nis) {
          return NextResponse.json(
            { success: false, error: "Invalid student payload" },
            { status: 400 }
          );
        }
        await prisma.student.upsert({
          where: { nis: data.nis },
          create: {
            id: data.id,
            nis: data.nis,
            name: data.name,
            class: data.class,
            status: data.status || "AKTIF",
            password: data.password || null,
          },
          update: {
            name: data.name,
            class: data.class,
            status: data.status,
            ...(data.password ? { password: data.password } : {}),
          },
        });
        return NextResponse.json({ success: true, event, message: "Student upserted" });
      }

      case "student.delete": {
        if (!data || !data.nis) {
          return NextResponse.json(
            { success: false, error: "Invalid student payload" },
            { status: 400 }
          );
        }
        await prisma.student.delete({
          where: { nis: data.nis },
        }).catch(() => null);
        return NextResponse.json({ success: true, event, message: "Student deleted" });
      }

      case "teacher.upsert": {
        if (!data || !data.id) {
          return NextResponse.json(
            { success: false, error: "Invalid teacher payload" },
            { status: 400 }
          );
        }
        await prisma.teacher.upsert({
          where: { id: Number(data.id) },
          create: {
            id: Number(data.id),
            nip: data.nip || null,
            name: data.name,
            subject: data.subject || null,
            position: data.position || "GURU",
            password: data.password || null,
          },
          update: {
            name: data.name,
            nip: data.nip || null,
            subject: data.subject || null,
            position: data.position || "GURU",
            ...(data.password ? { password: data.password } : {}),
          },
        });
        return NextResponse.json({ success: true, event, message: "Teacher upserted" });
      }

      case "teacher.delete": {
        if (!data || !data.id) {
          return NextResponse.json(
            { success: false, error: "Invalid teacher payload" },
            { status: 400 }
          );
        }
        await prisma.teacher.delete({
          where: { id: Number(data.id) },
        }).catch(() => null);
        return NextResponse.json({ success: true, event, message: "Teacher deleted" });
      }

      case "academicYear.upsert": {
        if (!data || !data.id) {
          return NextResponse.json(
            { success: false, error: "Invalid academicYear payload" },
            { status: 400 }
          );
        }
        await prisma.academicYear.upsert({
          where: { id: Number(data.id) },
          create: {
            id: Number(data.id),
            name: data.name,
            isActive: Boolean(data.isActive),
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
          },
          update: {
            name: data.name,
            isActive: Boolean(data.isActive),
            ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
            ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
          },
        });
        return NextResponse.json({ success: true, event, message: "Academic Year upserted" });
      }

      case "bulk_sync": {
        const { students = [], teachers = [], academicYears = [] } = data || {};

        let syncedStudents = 0;
        let syncedTeachers = 0;
        let syncedYears = 0;

        for (const yr of academicYears) {
          await prisma.academicYear.upsert({
            where: { id: Number(yr.id) },
            create: {
              id: Number(yr.id),
              name: yr.name,
              isActive: Boolean(yr.isActive),
              startDate: new Date(yr.startDate),
              endDate: new Date(yr.endDate),
            },
            update: {
              name: yr.name,
              isActive: Boolean(yr.isActive),
              ...(yr.startDate ? { startDate: new Date(yr.startDate) } : {}),
              ...(yr.endDate ? { endDate: new Date(yr.endDate) } : {}),
            },
          });
          syncedYears++;
        }

        for (const t of teachers) {
          await prisma.teacher.upsert({
            where: { id: Number(t.id) },
            create: {
              id: Number(t.id),
              nip: t.nip || null,
              name: t.name,
              subject: t.subject || null,
              position: t.position || "GURU",
            },
            update: {
              name: t.name,
              nip: t.nip || null,
              subject: t.subject || null,
            },
          });
          syncedTeachers++;
        }

        for (const s of students) {
          await prisma.student.upsert({
            where: { nis: s.nis },
            create: {
              id: Number(s.id),
              nis: s.nis,
              name: s.name,
              class: s.class,
              status: s.status || "AKTIF",
            },
            update: {
              name: s.name,
              class: s.class,
              status: s.status,
            },
          });
          syncedStudents++;
        }

        return NextResponse.json({
          success: true,
          event,
          message: "Bulk sync completed successfully",
          syncedStudents,
          syncedTeachers,
          syncedYears,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unhandled event type: ${event}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
