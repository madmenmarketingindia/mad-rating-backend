import AttendancePayroll from "../models/AttendancePayroll.js";
import Employee from "../models/employee.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponseSuccess } from "../helper/serverError.js";
import { statusCode } from "../helper/statusCodes.js";
import Rating from "../models/rating.model.js";

const upsertPayroll = async (req, res) => {
  try {
    const {
      employeeId,
      month,
      year,
      basicSalary,
      hra,
      conveyanceAllowance,
      medicalAllowance,
      salary,
      totalDays,
      leaves = 0,
      leaveAdjusted = 0,
      absent = 0,
      lateIn = 0,
      lateAdjusted = 0,
      deductions = 0,
      reimbursement = 0,
      incentive = 0,
      status,
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json(new apiError(404, "Employee not found."));

    const baseSalary = salary ?? employee.salary ?? 0;
    const totalWorkingDays = totalDays ?? 0;

    // apply leaveAdjusted by reducing leaves (can't adjust more than leaves)
    const usableLeaveAdjusted = Math.min(leaveAdjusted, leaves);
    const remainingLeaves = Math.max(0, leaves - usableLeaveAdjusted);

    //  each lateIn counts as 0.5 day absent
    const lateDays = (lateIn ?? 0) * 0.5;

    // 3) calculate present (after reducing remaining leaves and lateDays)
    let rawPresent = totalWorkingDays - (absent + remainingLeaves + lateDays);
    if (rawPresent < 0) rawPresent = 0;

    // keep present in 0.5 increments
    const present = Math.round(rawPresent * 2) / 2;

    // 4) lateAdjusted restores 0.5 day per adjusted late (can't adjust more than lateIn)
    const usableLateAdjusted = Math.min(lateAdjusted, lateIn);
    const lateAdjustedDays = usableLateAdjusted * 0.5;

    // 5) payableDays = present + restored leave adjustments? (we already applied leaveAdjusted by reducing leaves)
    // so we only add restored late days here
    let rawPayableDays = present + lateAdjustedDays;
    if (rawPayableDays < 0) rawPayableDays = 0;
    const payableDays = Math.round(rawPayableDays * 2) / 2; // keep 0.5 increments

    // 6) salary calculations
    const perDaySalary =
      totalWorkingDays > 0 ? baseSalary / totalWorkingDays : 0;
    let calculatedPayable = perDaySalary * payableDays;
    let finalPayable = calculatedPayable - deductions;
    if (finalPayable < 0) finalPayable = 0;

    let total = finalPayable + reimbursement + incentive;
    if (total < 0) total = 0;

    // round currency to 2 decimals
    finalPayable = Number(finalPayable.toFixed(2));
    total = Number(total.toFixed(2));

    const payroll = await AttendancePayroll.findOneAndUpdate(
      { employeeId, month, year },
      {
        $set: {
          basicSalary,
          hra,
          medicalAllowance,
          conveyanceAllowance,
          salary: baseSalary,
          totalDays: totalWorkingDays,
          present,
          leaves,
          leaveAdjusted: usableLeaveAdjusted,
          absent,
          lateIn,
          lateAdjusted: usableLateAdjusted,
          deductions,
          payableDays,
          payable: finalPayable,
          reimbursement,
          incentive,
          total,
          bankName: employee.bankDetails?.bankName,
          accountNo: employee.bankDetails?.accountNo,
          ifscCode: employee.bankDetails?.ifscCode,
          status: status ?? "pending",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          payroll,
          true,
          statusCode.success,
          "Payroll saved/updated successfully!"
        )
      );
  } catch (error) {
    return res.status(500).json(new apiError(500, error.message));
  }
};

// GET /api/payroll/list?month=9&year=2025

const listPayrollByEmployees = async (req, res) => {
  try {
    let { month, year } = req.query;

    // ✅ If not provided → use current month/year
    const now = new Date();
    month = month || now.getMonth() + 1;
    year = year || now.getFullYear();

    // ✅ Get all employees
    const employees = await Employee.find();

    // ✅ Get payrolls for this month/year
    const payrolls = await AttendancePayroll.find({ month, year });

    // ✅ Merge payroll with employee info
    const data = employees.map((emp) => {
      const payroll = payrolls.find(
        (p) => String(p.employeeId) === String(emp._id)
      );

      return {
        _id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.officialDetails?.department || "",
        designation: emp.officialDetails?.designation || "",
        basicSalary: emp.salary.basic || 0,
        hra: emp.salary.hra || 0,
        medicalAllowance: emp.salary.medicalAllowance || 0,
        conveyanceAllowance: emp.salary.conveyanceAllowance || 0,
        salary: emp.salary?.ctc || 0,
        // if payroll exists → show, else show defaults
        payableDays: payroll?.payableDays || 0,
        payable: payroll?.payable || 0,
        total: payroll?.total || 0,
        totalDays: payroll?.totalDays || 0,
        status: payroll?.status || "Not Processed",
        month,
        year,
      };
    });

    res.json({
      data,
      success: true,
      successCode: 200,
      message: "Employee payroll list fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching payroll list:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getPayrollByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let { month, year } = req.query;

    if (!employeeId) {
      return res.status(400).json(new apiError(400, "Employee ID is required"));
    }

    // Default month/year
    const now = new Date();
    month = Number(month) || now.getMonth() + 1;
    year = Number(year) || now.getFullYear();

    // Fetch employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    // Fetch payroll for this employee/month/year
    const payroll = await AttendancePayroll.findOne({
      employeeId,
      month,
      year,
    });

    // Merge employee + payroll
    const data = {
      _id: payroll?._id || null,
      employeeId: employee._id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.officialDetails?.department || "",
      designation: employee.officialDetails?.designation || "",
      basicSalary: employee.salary.basic || 0,
      hra: employee.salary.hra || 0,
      medicalAllowance: employee.salary.medicalAllowance || 0,
      conveyanceAllowance: employee.salary.conveyanceAllowance || 0,
      salary: payroll?.salary || employee.salary?.ctc || 0,
      totalDays: payroll?.totalDays || 30,
      leaves: payroll?.leaves || 0,
      leaveAdjusted: payroll?.leaveAdjusted || 0,
      absent: payroll?.absent || 0,
      lateIn: payroll?.lateIn || 0,
      lateAdjusted: payroll?.lateAdjusted || 0,
      deductions: payroll?.deductions || 0,
      reimbursement: payroll?.reimbursement || 0,
      incentive: payroll?.incentive || 0,
      payableDays: payroll?.payableDays || 0,
      payable: payroll?.payable || 0,
      total: payroll?.total || 0,
      status: payroll?.status || "Not Processed",
      month,
      year,
      createdAt: payroll?.createdAt || null,
      updatedAt: payroll?.updatedAt || null,
    };

    return res
      .status(200)
      .json(
        apiResponseSuccess(
          data,
          true,
          statusCode.success,
          "Employee payroll fetched successfully!"
        )
      );
  } catch (error) {
    console.error("Error fetching single employee payroll:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

const calculateIncentive = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let { month, year } = req.query;

    if (!employeeId) {
      return res.status(400).json(new apiError(400, "Employee ID is required"));
    }

    const now = new Date();
    month = Number(month) || now.getMonth() + 1;
    year = Number(year) || now.getFullYear();

    // ✅ Fetch employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json(new apiError(404, "Employee not found"));
    }

    const totalSalary = employee.salary?.ctc || 0;

    // ✅ Fetch rating
    const rating = await Rating.findOne({ employeeId, month, year });

    let avg = 0;
    let incentive = 0;
    let incentivePct = 0;

    if (rating) {
      avg = Number(rating.averageScore) || 0;

      if (avg > 4.4) {
        const minPct = 5;
        const maxPct = 15;

        const factor = (avg - 4.4) / (5 - 4.4);
        incentivePct = minPct + factor * (maxPct - minPct);
        incentive = (totalSalary * incentivePct) / 100;
      }
    }

    return res.status(200).json(
      apiResponseSuccess(
        {
          employeeId,
          month,
          year,
          averageRating: avg,
          totalSalary,
          incentivePercent: Number(incentivePct.toFixed(2)),
          incentiveAmount: Number(incentive.toFixed(2)),
        },
        true,
        statusCode.success,
        "Incentive calculated successfully"
      )
    );
  } catch (error) {
    console.error("Error calculating incentive:", error);
    return res.status(500).json(new apiError(500, error.message));
  }
};

export {
  upsertPayroll,
  listPayrollByEmployees,
  getPayrollByEmployee,
  calculateIncentive,
};
