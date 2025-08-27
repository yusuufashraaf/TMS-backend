const PDFDocument = require("pdfkit");
const Task = require("../models/Task");
const Project = require("../models/Project");
const mongoose = require("mongoose");

exports.generateProjectPDF = async (req, res) => {
  try {
    const projectId = req.params.projectId.trim();

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid projectId" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ status: "failed", message: "Project not found" });
    }

    const tasks = await Task.find({ projectId }).populate(
      "assignedTo",
      "name email"
    );
    if (!tasks || tasks.length === 0) {
      return res
        .status(404)
        .json({ status: "failed", message: "No tasks found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${project.name.replace(/\s+/g, "_")}.pdf`
    );

    doc.pipe(res);

    // Title
    doc
      .fontSize(22)
      .fillColor("#222")
      .text("Project Tasks Report", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(16)
      .fillColor("#555")
      .text(`${project.name}`, { align: "center", underline: true });

    doc.moveDown(2);

    // Table column positions
    const tableTop = doc.y;
    const colWidths = {
      title: 150,
      assigned: 100,
      priority: 80,
      status: 80,
      deadline: 100,
    };
    const startX = 50;
    const defaultRowHeight = 30;

    // Draw header background
    doc.rect(startX, tableTop, 510, defaultRowHeight).fill("#4CAF50");
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(12);

    // Column headers
    let x = startX + 5;
    doc.text("Title", x, tableTop + 7, {
      width: colWidths.title,
      align: "left",
    });
    x += colWidths.title;
    doc.text("Assigned To", x, tableTop + 7, {
      width: colWidths.assigned,
      align: "left",
    });
    x += colWidths.assigned;
    doc.text("Priority", x, tableTop + 7, {
      width: colWidths.priority,
      align: "center",
    });
    x += colWidths.priority;
    doc.text("Status", x, tableTop + 7, {
      width: colWidths.status,
      align: "center",
    });
    x += colWidths.status;
    doc.text("Deadline", x, tableTop + 7, {
      width: colWidths.deadline,
      align: "center",
    });

    // Header borders
    doc.rect(startX, tableTop, 510, defaultRowHeight).stroke("black");
    let headerX = startX;
    Object.values(colWidths).forEach((width) => {
      headerX += width;
      doc
        .moveTo(headerX, tableTop)
        .lineTo(headerX, tableTop + defaultRowHeight)
        .stroke("black");
    });

    let y = tableTop + defaultRowHeight;

    // Table rows
    tasks.forEach((task, index) => {
      const rowData = [
        task.title,
        task.assignedTo?.name || "N/A",
        task.priority,
        task.status,
        task.deadline ? task.deadline.toDateString() : "N/A",
      ];

      // Measure row height dynamically
      const rowHeights = rowData.map((text, i) => {
        return doc.heightOfString(text.toString(), {
          width: Object.values(colWidths)[i] - 5,
          align: "left",
        });
      });
      const rowHeight = Math.max(defaultRowHeight, ...rowHeights) + 10;

      // Background
      doc
        .rect(startX, y, 510, rowHeight)
        .fill(index % 2 !== 0 ? "#f9f9f9" : "#fff");

      // Row text
      doc.fillColor("#000").font("Helvetica").fontSize(11);
      let x = startX + 5;

      doc.text(rowData[0], x, y + 7, {
        width: colWidths.title - 5,
        align: "left",
      });
      x += colWidths.title;

      doc.text(rowData[1], x, y + 7, {
        width: colWidths.assigned - 5,
        align: "left",
      });
      x += colWidths.assigned;

      doc.text(rowData[2], x, y + 7, {
        width: colWidths.priority - 5,
        align: "center",
      });
      x += colWidths.priority;

      doc.text(rowData[3], x, y + 7, {
        width: colWidths.status - 5,
        align: "center",
      });
      x += colWidths.status;

      doc.text(rowData[4], x, y + 7, {
        width: colWidths.deadline - 5,
        align: "center",
      });

      // Borders around row
      doc.rect(startX, y, 510, rowHeight).stroke("black");

      // Column borders
      let colX = startX;
      Object.values(colWidths).forEach((width) => {
        colX += width;
        doc
          .moveTo(colX, y)
          .lineTo(colX, y + rowHeight)
          .stroke("black");
      });

      y += rowHeight;
    });

    // Footer
    doc.fontSize(9).fillColor("#555");
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.text(
        `Generated on: ${new Date().toLocaleString()}`,
        50,
        doc.page.height - 40,
        { align: "left" }
      );
      doc.text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 40, {
        align: "right",
      });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ status: "failed", message: err.message });
    }
  }
};
