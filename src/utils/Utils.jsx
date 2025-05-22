import { Tooltip } from "react-bootstrap";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

    worksheet["!cols"] = columns.map((col, colIndex) => {
      let maxWidth = col.length * 1.2;
      rows.forEach(row => {
        if (row[col] !== null && row[col] !== undefined) {
          const cellContentLength = String(row[col]).length;
          maxWidth = Math.max(maxWidth, cellContentLength * 1.2);
        }
      });
      return { wch: Math.max(10, Math.min(maxWidth, 50)) };
    });

    const headerRowIndex = 3;

    const headerStyle = {
      fill: { fgColor: { rgb: "CBD5E1" } },
      font: { bold: true, color: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    columns.forEach((col, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIndex });
      if (!worksheet[cellRef]) worksheet[cellRef] = {};
      worksheet[cellRef].s = headerStyle;
    });

    const titleStyle = {
      font: { bold: true, size: 14, color: { rgb: "0064E6" } },
      alignment: { horizontal: "left" },
    };
    worksheet[XLSX.utils.encode_cell({ r: 0, c: 0 })].s = titleStyle;

    const filterStyle = {
      font: { italic: true, color: { rgb: "666666" } },
      alignment: { horizontal: "left" },
    };
    worksheet[XLSX.utils.encode_cell({ r: 1, c: 0 })].s = filterStyle;

    XLSX.utils.book_append_sheet(workbook, worksheet, reportName);

    const writeOptions = {
      bookType: "xlsx",
      bookSST: false,
      type: "binary",
      compression: true,
    };

    XLSX.writeFile(workbook, `${reportName}.xlsx`, writeOptions);
  }

  static exportToExcelJS(rows, reportName, headerRequired,filter,reportColumns) {  
      
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportName);

    const columns = Object.keys(rows[0]).filter((x) => x !== "id");

    let filterText = "";
    Object.keys(filter).map((item) => {
      filterText +=
        `${item}: ${
          filter[item] == "0" || filter[item] == "1" ? "ALL" : filter[item]
        }` + "   ";
    });

let staticRowsCount = 0;
if(headerRequired){
// Add company name row and make it span across all columns
const companyName = worksheet.addRow(["GEORGETOWN INTERNATIONAL ACADEMY"]);
companyName.font = { bold: true, size: 14, color: { argb: "FF0D384D" } };
companyName.alignment = { horizontal: "left" };
staticRowsCount++;

// Add title row
const titleRow = worksheet.addRow([reportName]);
titleRow.font = { bold: true, size: 14, color: { argb: "FF0064E6" } };
titleRow.alignment = { horizontal: "left" };
staticRowsCount++;

// Add filter row
const filterRow = worksheet.addRow([filterText]);
filterRow.font = { italic: true, color: { argb: "FF666666" } };
filterRow.alignment = { horizontal: "left" };
staticRowsCount++;


  // Add empty row
  worksheet.addRow([]);
  staticRowsCount++;
  
  // Add header row
  const headerRow = worksheet.addRow(columns);
  staticRowsCount++;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCBD5E1" },
    };
    cell.font = { bold: true, color: { argb: "FF000000" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  
}

const columnMetaMap = {};
reportColumns.forEach((col) => {
  if (!["id", "slno", "employeecode"].includes(col.columnName.toLowerCase())) {
    columnMetaMap[col.columnName] = {
      alignment: col.alignment?.toLowerCase() || "left",
      dataType: col.dataType?.toLowerCase() || "string",
    };
  }
});
const excludedColumns = ["employeecode"];
    const numericColumnIndexes = columns.map((col, index) => {
      const values = rows.map((row) => row[col]);
      const number = values.find(
        (value) =>
          `${value}`.length > 0 && !isNaN(`${value}`.replaceAll(",", ""))
      );
      return {
        index: index + 1,
        isNumeric:
          number !== undefined &&
          number !== null &&
           !excludedColumns.includes(col.toLowerCase()),
        column: col,
      };
    });

    const boldColumnIndex = columns.map((col,index) => {
      if(["totalearnings","netsalary","totaldeductions"].includes(col.toLowerCase())) {
        return index + 1;
      }
    })

    // Add data rows
    rows.map((row, index) => {
      const rowValues = columns.map((col, index) => {
        const value = row[col];
  const meta = columnMetaMap[col] || {};
  
        //const isNumericColumn = numericColumnIndexes[index].isNumeric;

       if (meta.dataType === "currency" && value !== null && value !== undefined) {
        debugger
    if (typeof value === "string" && !isNaN(parseFloat(value))) {
      return parseFloat(value.replaceAll(",", ""));
    } else if (typeof value === "number") {
      return value;
    }
  }

        return value?.length > 0 ? value : " ";
      });

      const dataRow = worksheet.addRow(rowValues);
      if (index == rows.length - 1 && rows[rows.length - 1][Object.keys(rows[0])[0]].includes("Grand Total")) {
        dataRow.eachCell((cell) => {
          cell.font = { bold: true }
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFA6A6A6" },
          };
        });
      }

      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        const columnInfo = numericColumnIndexes.find(
          (col) => col.index === colNumber
        );

        if(boldColumnIndex.includes(colNumber)) {
          cell.font = { bold: true }
        }

        if (columnInfo && columnInfo.isNumeric) {
          cell.alignment = { horizontal: "right" };
          cell.numFmt = "#,##0.00";
          const cellValue = cell.value;
          if (cellValue && typeof cellValue === 'number' && cellValue > 1000000) {
            worksheet.getColumn(colNumber).width = 18;
          }
        } else {
          cell.alignment = { horizontal: "left" };
        }
      });
    });

    if(headerRequired){
  worksheet.mergeCells(1, 1, 1, 3); 
    }
    // Merge cells for all title rows
  // Company name row

    // Calculate and set column widths
    columns.forEach((col, index) => {
      const colIndex = index + 1;
      const isNumericColumn = numericColumnIndexes.find(
        (c) => c.index === colIndex
      )?.isNumeric;

      let maxLength = col.length * 1.2;

      rows.forEach((row) => {
        const value = row[col];
        if (value !== null && value !== undefined) {
          if (
            typeof value === "number" ||
            (typeof value === "string" && !isNaN(parseFloat(value)))
          ) {
            const numValue =
              typeof value === "number" ? value : parseFloat(value);

            const numStr = String(numValue);
            const integerPart = Math.floor(Math.abs(numValue)).toString();
            const commaCount = Math.floor((integerPart.length - 1) / 3);

            const formattedLength =
              numStr.length + 
              commaCount + 
              (numStr.includes('.') ? 0 : 3) +
              (numValue < 0 ? 1 : 0); 
            maxLength = Math.max(maxLength, formattedLength);
          } else {
            maxLength = Math.max(maxLength, String(value).length);
          }
        }
      });

      const padding = 2;
      const minWidth = isNumericColumn ? 15 : 12;
      const maxWidth = 40;
      const columnWidth = Math.max(
        minWidth,
        Math.min(maxLength + padding, maxWidth)
      );

      worksheet.getColumn(colIndex).width = columnWidth;
    });

if(!headerRequired){
  worksheet.spliceRows(1, staticRowsCount);
}
    // Generate and save the file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `${reportName}.xlsx`);
    });
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

      // Set color for GEORGETOWN INTERNATIONAL ACADEMY to primary color (#0d384d)
      doc.setTextColor(13, 56, 77); // RGB values for #0d384d
      doc.setFontSize(12);
      doc.text("GEORGETOWN INTERNATIONAL ACADEMY", 14, 20, { align: "left" });

      // Reset color to blue for report name
      doc.setTextColor(0, 100, 230);
      doc.text(reportName, 14, 27, { align: "left" });
      doc.text(filterText, 14, 34, { align: "left" });

      var alignments = new Object();

      Object.keys(tableData[0]).map((item, index) => {
        if (!isNaN(tableData[0][item])) {
          if (!item.includes("EmployeeCode"))
            alignments[index] = { halign: "right" };
        } else {
          alignments[index] = { halign: "left" };
        }
      });

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 37,
        theme: "grid",
        headStyles: {
          fillColor: [203, 213, 225],
          textColor: [0, 0, 0],
        },
     bodyStyles: {
     textColor: [26, 26, 26],        // black
             // bold body
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
