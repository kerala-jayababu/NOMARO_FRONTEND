import { Tooltip } from "react-bootstrap";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default class Utils {
  static encodeBase64(string) {
    return btoa(string);
  }
  static decodeBase64(string) {
    return atob(string);
  }

  static renderTooltip(text) {
    return <Tooltip>{text}</Tooltip>;
  }

  static isEmpty = (value) => {
    return (
      value === undefined ||
      value === null ||
      value === "" ||
      value.trim() === ""
    );
  };

  static isNotEmpty = (value) => {
    return !Utils.isEmpty(value);
  };

  static toCamelCase(str) {
    if (str !== null && str !== undefined) {
      return str?.charAt(0)?.toUpperCase() + str?.slice(1)?.toLowerCase();
    } else {
      return null;
    }
  }

  static capitalizeFirstLetter(string) {
    if (string != "" && string != null) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
  }

  static formattedNumber = (val) => {
    if (val !== undefined && val !== null) {
      return val.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      // return val.toLocaleString('en-US');
    }
    return "";
  };

  // Function to convert an image to a base64 string
  static convertImgToBase64(url, callback) {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onerror = (e) => {
        callback(null);
      };
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        callback(dataURL);
      };
      img.src = url;
    } catch (err) {
      callback(null);
    }
  }

  static getMonthsForYear(year) {
    const monthNames = [
      { name: "Jan", digit: "01" },
      { name: "Feb", digit: "02" },
      { name: "Mar", digit: "03" },
      { name: "Apr", digit: "04" },
      { name: "May", digit: "05" },
      { name: "Jun", digit: "06" },
      { name: "Jul", digit: "07" },
      { name: "Aug", digit: "08" },
      { name: "Sep", digit: "09" },
      { name: "Oct", digit: "10" },
      { name: "Nov", digit: "11" },
      { name: "Dec", digit: "12" },
    ];
    return monthNames.map((month, index) => {
      return {
        index: index + 1,
        value: `${month.name}`,
        date: `${year}-${month.digit}-01`,
      };
    });
  }

  static contentExtractionFileExceedsMaxSize(file) {
    // Max size of 5MB allowed
    return file.size / (1024 * 1024) > 5;
  }

  static toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }

  static processExcelFile(file, salaryHeadList) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const resultArray = [];

        jsonData.forEach((row) => {
          salaryHeadList.forEach((salaryHead) => {
            if (Object.hasOwn(row, salaryHead.salaryHeadCode)) {
              if (row["EmployeeCode"]) {
                resultArray.push({
                  employeeCode: row["EmployeeCode"],
                  idSalaryHead: salaryHead.idSalaryHead,
                  salaryAmount: row[salaryHead.salaryHeadCode],
                });
              }
            }
          });
        });

        resolve(resultArray);
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  static timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    const units = [
      { label: "yr", seconds: 31536000 },
      { label: "mo", seconds: 2592000 },
      { label: "d", seconds: 86400 },
      { label: "hr", seconds: 3600 },
      { label: "min", seconds: 60 },
      { label: "sec", seconds: 1 },
    ];

    for (let unit of units) {
      const interval = Math.floor(diffInSeconds / unit.seconds);
      if (interval >= 1) {
        return `${interval}${unit.label} ago`;
      }
    }

    return "just now";
  }

  static exportToExcel(rows, reportName, filter) {
    const workbook = XLSX.utils.book_new();
    const columns = Object.keys(rows[0]).filter((x) => x !== "id");
    const titleRow = [reportName];
    let filterText = "";
    Object.keys(filter).map((item) => {
      filterText =
        filterText +
        `${item}: ${
          filter[item] == "0" || filter[item] == "1" ? "ALL" : filter[item]
        }` +
        "   ";
    });
    const appliedFilter = [filterText];
    const emptyRow = [];
    const dataRows = rows.map(({ id, ...rest }) => Object.values(rest));
    const finalData = [titleRow, appliedFilter, emptyRow, columns, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(finalData);
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    ];

    worksheet["!cols"] = columns.map((col) => ({
      wch: Math.max(
        rows[0][col] ? String(rows[0][col]).length * 1.2 : col.length * 2,
        col.length * 2
      ),
    }));

    XLSX.utils.book_append_sheet(workbook, worksheet, reportName);
    XLSX.writeFile(workbook, `${reportName}.xlsx`, { compression: true });
  }

  static exportToPdf(rows, reportName, orientation, filter) {
    try {
      const doc = new jsPDF({
        orientation: orientation,
      });
      const tableData = rows.map(({ id, ...rest }) => Object.values(rest));
      const tableHeaders = Object.keys(rows[0]).filter((x) => x !== "id");
      let filterText = "";
      Object.keys(filter).map((item) => {
        filterText =
          filterText +
          `${item}: ${
            filter[item] == "0" || filter[item] == "1" ? "ALL" : filter[item]
          }` +
          "   ";
      });
      doc.setTextColor(0, 100, 230);
      doc.setFontSize(12);
      doc.text(reportName, 14, 20, { align: "left" });
      doc.text(filterText, 14, 27, { align: "left" });
      var alignments = new Object();

      Object.keys(tableData[0]).map((item, index) => {
        if (!isNaN(tableData[0][item])) {
          alignments[index] = { halign: "right" };
        }
      });

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 30,
        theme: "grid",
        headStyles: {
          fillColor: [203, 213, 225],
          textColor: [0, 0, 0],
        },
        columnStyles: {
          ...alignments,
        },
        didDrawPage: function () {
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.text(
            "Printed on: " + Utils.formatDateTime(new Date()),
            orientation === "landscape" ? 283 : 196,
            pageHeight - 10,
            { align: "right" }
          );
        },
      });

      for (let i = 0; i < doc.getNumberOfPages(); i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text(
          `Page ${
            i == 0 ? doc.getNumberOfPages() : i
          } of ${doc.getNumberOfPages()}`,
          14,
          pageHeight - 10,
          { align: "left" }
        );
      }
      doc.save(`${reportName}.pdf`);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
    }
    
  static formatDateTime(date) {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return formatter.format(date).replace("pm", "PM").replace("am", "AM");
  }
}

export const spdata = [
  {
    id: 1,
    EmployeeCode: "EMP003",
    EmployeeName: "Rohit ",
    Designation: "Senior Teacher",
    Department: "Teaching Staff",
    SalaryMonth: "March, 2025",
    TotalEarnings: 22900.0,
    TotalDeductions: 2300.0,
    NetSalary: 20600.0,
  },
  {
    id: 2,
    EmployeeCode: "EMP004",
    EmployeeName: "Amitabh Verma",
    Designation: "Senior Teacher",
    Department: "Teaching Staff",
    SalaryMonth: "April, 2025",
    TotalEarnings: 20000.0,
    TotalDeductions: 0.0,
    NetSalary: 20000.0,
  },
  {
    id: 3,
    EmployeeCode: "EMP006",
    EmployeeName: "Siddharth Malhotra",
    Designation: "Assistant Teacher",
    Department: "Teaching Staff",
    SalaryMonth: "March, 2025",
    TotalEarnings: 20900.0,
    TotalDeductions: 1900.0,
    NetSalary: 19000.0,
  },
  {
    id: 4,
    EmployeeCode: "EMP010",
    EmployeeName: "Rahul Chatterjee",
    Designation: "Assistant Teacher",
    Department: "Teaching Staff",
    SalaryMonth: "March, 2025",
    TotalEarnings: 23000.0,
    TotalDeductions: 6100.0,
    NetSalary: 16900.0,
  },
  {
    id: 5,
    EmployeeCode: "EMP011",
    EmployeeName: "Ananya Menon",
    Designation: "Assistant Teacher",
    Department: "Teaching Staff",
    SalaryMonth: "March, 2025",
    TotalEarnings: 12500.0,
    TotalDeductions: 500.0,
    NetSalary: 12000.0,
  },
  {
    id: 6,
    EmployeeCode: "EMP014",
    EmployeeName: "Shruti Bhattacharya",
    Designation: "Assistant Teacher",
    Department: "Teaching Staff",
    SalaryMonth: "March, 2025",
    TotalEarnings: 22850.0,
    TotalDeductions: 1600.0,
    NetSalary: 21250.0,
  },
  {
    id: 7,
    EmployeeCode: "EMP018",
    EmployeeName: "Ishita Agarwal",
    Designation: "Facilities Manager",
    Department: "Finance Department",
    SalaryMonth: "March, 2025",
    TotalEarnings: 750000.0,
    TotalDeductions: 6500.0,
    NetSalary: 743500.0,
  },
  {
    id: 8,
    EmployeeCode: "EMP019",
    EmployeeName: "Sanya Tiwari",
    Designation: "Facilities Manager",
    Department: "Finance Department",
    SalaryMonth: "March, 2025",
    TotalEarnings: 5000.0,
    TotalDeductions: 2500.0,
    NetSalary: 2500.0,
  },
  {
    id: 9,
    EmployeeCode: "EMP020",
    EmployeeName: "Divya Kulkarni",
    Designation: "Facilities Manager",
    Department: "Finance Department",
    SalaryMonth: "March, 2025",
    TotalEarnings: 20000.0,
    TotalDeductions: 500.0,
    NetSalary: 19500.0,
  },
];
