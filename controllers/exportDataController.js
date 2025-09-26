import ExcelJS from "exceljs";
import Employee from "../models/employee.model.js";
import AttendancePayroll from "../models/AttendancePayroll.js";
import TeamIncentive from "../models/teamIncentive.model.js";

const exportEmployees = async (req, res) => {
  try {
    // Fetch all employees with User reference populated (optional)
    const employees = await Employee.find().populate("userId");

    // Create workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employees");

    // Define headers
    worksheet.columns = [
      { header: "Employee ID", key: "employeeId", width: 15 },
      { header: "Employee Name", key: "employeeName", width: 25 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Department", key: "department", width: 20 },
      { header: "Date of Birth", key: "dob", width: 15 },
      { header: "Joining Date", key: "joiningDate", width: 15 },
      { header: "Last Working Day", key: "lastDay", width: 15 },
      { header: "Employment Status", key: "status", width: 15 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone Number", key: "phone", width: 15 },
      { header: "Residential Address", key: "resAddress", width: 30 },
      { header: "Permanent Address", key: "perAddress", width: 30 },
      { header: "Emergency Contact", key: "emergencyContact", width: 25 },
      { header: "Bank Name", key: "bankName", width: 20 },
      { header: "Branch Name", key: "branchName", width: 20 },
      { header: "Account Holder", key: "accountHolder", width: 20 },
      { header: "Account Number", key: "accountNumber", width: 20 },
      { header: "IFSC Code", key: "ifsc", width: 15 },
      { header: "Account Type", key: "accountType", width: 15 },
      { header: "Basic Salary", key: "basic", width: 15 },
      { header: "HRA", key: "hra", width: 15 },
      { header: "Medical Allowance", key: "medical", width: 20 },
      { header: "Conveyance Allowance", key: "conveyance", width: 20 },
      { header: "Other Allowances", key: "otherAllowances", width: 20 },
      { header: "Deductions", key: "deductions", width: 15 },
      { header: "Salary", key: "ctc", width: 15 },
    ];

    // Insert rows
    employees.forEach((emp) => {
      worksheet.addRow({
        employeeId: emp.employeeId || "-",
        employeeName: `${emp.firstName || ""} ${emp.lastName || ""}`,
        designation: emp.officialDetails?.designation || "-",
        department: emp.officialDetails?.department || "-",
        dob: emp.dateOfBirth
          ? emp.dateOfBirth.toISOString().split("T")[0]
          : "-",
        joiningDate: emp.officialDetails?.joiningDate
          ? emp.officialDetails.joiningDate.toISOString().split("T")[0]
          : "-",
        lastDay: emp.officialDetails?.lastWorkingDay
          ? emp.officialDetails.lastWorkingDay.toISOString().split("T")[0]
          : "-",
        status: emp.employmentStatus,
        gender: emp.gender || "-",
        email: emp.email || "-",
        phone: emp.phoneNumber || "-",
        resAddress: emp.residentialAddress || "-",
        perAddress: emp.permanentAddress || "-",
        emergencyContact: emp.emergencyContact || "-",
        bankName: emp.bankDetails?.bankName || "-",
        branchName: emp.bankDetails?.branchName || "-",
        accountHolder: emp.bankDetails?.accountHolderName || "-",
        accountNumber: emp.bankDetails?.accountNumber || "-",
        ifsc: emp.bankDetails?.ifscCode || "-",
        accountType: emp.bankDetails?.accountType || "-",
        basic: emp.salary?.basic || 0,
        hra: emp.salary?.hra || 0,
        medical: emp.salary?.medicalAllowance || 0,
        conveyance: emp.salary?.conveyanceAllowance || 0,
        otherAllowances: emp.salary?.otherAllowances || 0,
        deductions: emp.salary?.deductions || 0,
        ctc: emp.salary?.ctc || 0,
      });
    });

    // Format header row (bold)
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Send file as response
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=employees.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Error exporting employees", error });
  }
};

const toExcelValue = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") {
    if (val._bsontype === "ObjectID") return val.toString();
    if (val instanceof Date) return val.toISOString().split("T")[0];
    return JSON.stringify(val);
  }
  return val.toString();
};

const calculateNetPay = (payroll) => {
  const totalDays = payroll.totalDays ?? 0;

  // Leave deduction
  const leaveDeduction = Math.max(
    (payroll.leaves ?? 0) - (payroll.leaveAdjusted ?? 0),
    0
  );

  // Late deduction: each late counts 0.5 day unless adjusted
  const effectiveLate = Math.max(
    (payroll.lateIn ?? 0) - (payroll.lateAdjusted ?? 0),
    0
  );
  const lateDeduction = effectiveLate * 0.5;

  // Absent deduction
  const absentDeduction = payroll.absent ?? 0;

  // Total deduction days
  const totalDeductionDays = leaveDeduction + lateDeduction + absentDeduction;

  // Total salary components
  const totalSalaryComponents =
    (payroll.salary ?? 0) +
    (payroll.incentive ?? 0) +
    (payroll.teamIncentive ?? 0) +
    (payroll.reimbursement ?? 0);

  // Per day amount
  const perDaySalary = totalDays > 0 ? payroll?.salary / totalDays : 0;

  // Deduction amount
  const deductionAmount = perDaySalary * totalDeductionDays;

  // Net pay after deductions and explicit deductions
  const netPay =
    totalSalaryComponents - (payroll.deductions ?? 0) - deductionAmount;

  return Number(netPay.toFixed(2));
};

const exportPayrollExcel = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    // Fetch payrolls
    const payrolls = await AttendancePayroll.find({ month, year }).populate(
      "employeeId"
    );
    if (!payrolls.length) {
      return res
        .status(404)
        .json({ success: false, message: "No payroll data found." });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Payroll-${month}-${year}`);

    // Columns
    sheet.columns = [
      { header: "Employee ID", key: "employeeId", width: 15 },
      { header: "Employee Name", key: "employeeName", width: 25 },
      { header: "Department", key: "department", width: 20 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Month", key: "month", width: 10 },
      { header: "Year", key: "year", width: 10 },
      { header: "Total Days", key: "totalDays", width: 12 },
      { header: "Present", key: "present", width: 10 },
      { header: "Absent", key: "absent", width: 10 },
      { header: "Leaves", key: "leaves", width: 10 },
      { header: "Leave Adjusted", key: "leaveAdjusted", width: 14 },
      { header: "Late In", key: "lateIn", width: 10 },
      { header: "Late Adjusted", key: "lateAdjusted", width: 14 },
      { header: "Salary", key: "salary", width: 14 },
      { header: "Basic Salary", key: "basicSalary", width: 15 },
      { header: "HRA", key: "hra", width: 12 },
      { header: "Medical Allowance", key: "medicalAllowance", width: 18 },
      { header: "Conveyance Allowance", key: "conveyanceAllowance", width: 20 },
      { header: "Incentive", key: "incentive", width: 12 },
      { header: "Team Incentive", key: "teamIncentive", width: 15 },
      { header: "Deductions", key: "deductions", width: 12 },
      { header: "Net Pay", key: "netPay", width: 15 },
      { header: "Payable Days", key: "payableDays", width: 15 },
      { header: "Status", key: "status", width: 12 },
    ];

    // Header style
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add rows
    payrolls.forEach((p) => {
      const emp = p.employeeId || {};
      const netPay = calculateNetPay(p);

      const rowValues = [
        emp.employeeId,
        `${emp.firstName ?? ""} ${emp.lastName ?? ""}`,
        emp.officialDetails?.department ?? "",
        emp.officialDetails?.designation ?? "",
        p.month ?? "",
        p.year ?? "",
        p.totalDays ?? 0,
        p.present ?? 0,
        p.absent ?? 0,
        p.leaves ?? 0,
        p.leaveAdjusted ?? 0,
        p.lateIn ?? 0,
        p.lateAdjusted ?? 0,
        p.salary ?? 0,
        p.basicSalary ?? 0,
        p.hra ?? 0,
        p.medicalAllowance ?? 0,
        p.conveyanceAllowance ?? 0,
        p.incentive ?? 0,
        p.teamIncentive ?? 0,
        p.deductions ?? 0,
        netPay,
        p.payableDays ?? 0,
        p.status ?? "Pending",
      ];

      const row = sheet.addRow(rowValues.map(toExcelValue));

      // Align numeric cells
      row.eachCell((cell, colNumber) => {
        if (colNumber >= 14 && colNumber <= 22)
          cell.alignment = { horizontal: "right" };
        else cell.alignment = { horizontal: "left" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Payroll-${month}-${year}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Payroll Export Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export { exportEmployees, exportPayrollExcel };
