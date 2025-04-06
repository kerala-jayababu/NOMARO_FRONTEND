import { Tooltip } from "react-bootstrap";
import * as XLSX from "xlsx";

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
        return value === undefined || value === null || value === '' || value.trim() === '';
    }

    static isNotEmpty = (value) => {
        return !Utils.isEmpty(value);
    }

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
        return '';
    }

    // Function to convert an image to a base64 string
    static convertImgToBase64(url, callback) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onerror = (e) => {
                callback(null);
            };
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                callback(dataURL);
            };
            img.src = url;
        } catch (err) {
            callback(null);
        }
    }

    static getMonthsForYear(year) {
        const monthNames = [
            { name: "Jan", digit: '01' },
            { name: "Feb", digit: '02' },
            { name: "Mar", digit: '03' },
            { name: "Apr", digit: '04' },
            { name: "May", digit: '05' },
            { name: "Jun", digit: '06' },
            { name: "Jul", digit: '07' },
            { name: "Aug", digit: '08' },
            { name: "Sep", digit: '09' },
            { name: "Oct", digit: '10' },
            { name: "Nov", digit: '11' },
            { name: "Dec", digit: '12' },
        ];
        return monthNames.map((month, index) => {
            return {
                index: index + 1,
                value: `${month.name}`,
                date: `${year}-${month.digit}-01`
            }
        });
    }

    static contentExtractionFileExceedsMaxSize(file) {
        // Max size of 5MB allowed
        return (file.size / (1024 * 1024)) > 5;
    }

    static toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
        );
    }

    static processExcelFile(file, salaryHeadList){
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
                    if(Object.hasOwn(row, salaryHead.salaryHeadCode)){
                        if(row["EmployeeCode"]){
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
    };
    
    static timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    const units = [
        { label: 'yr', seconds: 31536000 },
        { label: 'mo', seconds: 2592000 },
        { label: 'd', seconds: 86400 },
        { label: 'hr', seconds: 3600 },
        { label: 'min', seconds: 60 },
        { label: 'sec', seconds: 1 }
    ];

    for (let unit of units) {
        const interval = Math.floor(diffInSeconds / unit.seconds);
        if (interval >= 1) {
            return `${interval}${unit.label} ago`;
        }
    }

    return 'just now';
}
}
