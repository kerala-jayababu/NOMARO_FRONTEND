// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchDesignations, addMasterDesignation, getMasterDesignationListById } from "../../redux/reducers/designation";
// import Card from "../../components/card";
// import Table from "../../components/table";
// import Input from "../../components/input";
// import Button from "../../components/button";
// import RadioButton from "../../components/radioButton";

// const Designation = () => {
//   const dispatch = useDispatch();
//   const designationState = useSelector((state) => state.designation);
//   const { designation, loading, error } = designationState;

//   const [formData, setFormData] = useState({
//     code: "",
//     name: "",
//     overtime: "",
//   });

//   useEffect(() => {
//     dispatch(fetchDesignations());
//   }, [dispatch]);

//   const handleChange = (name, value) => {
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     const payload = {
//       designationCode: formData.code,
//       designationName: formData.name,
//       isOvertimeAllowanceAllowed: formData.overtime === "Yes",
//     };

//     try {
//       await dispatch(addMasterDesignation(payload)).unwrap();
//       setFormData({ code: "", name: "", overtime: "" });
//       dispatch(fetchDesignations());
//     } catch (err) {
//       console.error("Failed to add designation:", err);
//     }
//   };

//   const handleEditClick = async (id) => {
//     try {
//       const response = await dispatch(getMasterDesignationListById(id)).unwrap();
//       console.log("Designation Details:", response); // Debugging
//       if (response) {
//         setFormData({
//           code: response.data.designationCode,
//           name: response.data.designationName,
//           overtime: response.data.isOvertimeAllowanceAllowed ? "Yes" : "No",
//         });
//       }
//     } catch (err) {
//       console.error("Failed to fetch designation details:", err);
//     }
//   };

//   const columns = [
//     { key: "designationCode", label: "Des. Code" },
//     { key: "designationName", label: "Designation Name" },
//     {
//       key: "isOvertimeAllowanceAllowed",
//       label: "Overtime Allowed",
//       render: (value) => (value ? "Yes" : "No"),
//     },
//     { key: "actions", label: "" },
//   ];

//   return (
//     <div className="container-xxl flex-grow-1 container-p-y">
//       <div className="row">
//         <div className="col-lg-8">
//           <Card title="List of Designations">
//             {loading ? (
//               <p>Loading...</p>
//             ) : error ? (
//               <p className="text-danger">Error: {error}</p>
//             ) : (
//               <Table columns={columns} data={designation.data} onEditClick={handleEditClick} idKey="idDesignation" />
//             )}
//           </Card>
//         </div>

//         <div className="col-lg-4">
//           <Card title="Add/Update Designation">
//             <form onSubmit={handleSubmit}>
//               <Input
//                 label="Designation Code"
//                 name="code"
//                 value={formData.code}
//                 onChange={(e) => handleChange("code", e.target.value)}
//                 maxLength="10"
//               />
//               <Input
//                 label="Designation Name"
//                 name="name"
//                 value={formData.name}
//                 onChange={(e) => handleChange("name", e.target.value)}
//                 maxLength="50"
//               />
//               <RadioButton
//                 name="overtime"
//                 options={[{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }]}
//                 selectedValue={formData.overtime}
//                 onChange={(value) => handleChange("overtime", value)}
//               />
//               <div className="text-center">
//                 <Button type="submit" className="btn btn-primary px-4 me-2">
//                   Submit
//                 </Button>
//                 <Button
//                   type="reset"
//                   className="btn btn-outline-secondary px-4"
//                   onClick={() => setFormData({ code: "", name: "", overtime: "" })}
//                 >
//                   Reset
//                 </Button>
//               </div>
//             </form>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Designation;


import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDesignations, addMasterDesignation, getMasterDesignationListById, updateDesignations } from "../../redux/reducers/designation";
import Card from "../../components/card";
import Table from "../../components/table";
import Input from "../../components/input";
import Button from "../../components/button";
import RadioButton from "../../components/radioButton";

const Designation = () => {
  const dispatch = useDispatch();
  const designationState = useSelector((state) => state.designation);
  const { designation, loading, error } = designationState;

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    overtime: "",
  });

  const [editId, setEditId] = useState(null); // Track edit mode

  useEffect(() => {
    dispatch(fetchDesignations());
  }, [dispatch]);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      idDesignation: editId, // Include only if updating
      designationCode: formData.code,
      designationName: formData.name,
      isOvertimeAllowanceAllowed: formData.overtime === "Yes",
    };

    try {
      if (editId) {
        await dispatch(updateDesignations(payload)).unwrap();
      } else {
        await dispatch(addMasterDesignation(payload)).unwrap();
      }
      
      setFormData({ code: "", name: "", overtime: "" });
      setEditId(null); // Reset edit mode
      dispatch(fetchDesignations());
    } catch (err) {
      console.error("Failed to save designation:", err);
    }
  };

  const handleEditClick = async (id) => {
    try {
      const response = await dispatch(getMasterDesignationListById(id)).unwrap();
      if (response) {
        setFormData({
          code: response.data.designationCode,
          name: response.data.designationName,
          overtime: response.data.isOvertimeAllowanceAllowed ? "Yes" : "No",
        });
        setEditId(id);
      }
    } catch (err) {
      console.error("Failed to fetch designation details:", err);
    }
  };

  const handleReset = () => {
    setFormData({ code: "", name: "", overtime: "" });
    setEditId(null); // Exit edit mode
  };

  const columns = [
    { key: "designationCode", label: "Des. Code" },
    { key: "designationName", label: "Designation Name" },
    {
      key: "isOvertimeAllowanceAllowed",
      label: "Overtime Allowed",
      render: (value) => (value ? "Yes" : "No"),
    },
    { key: "actions", label: "" },
  ];

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-8">
          <Card title="List of Designations">
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-danger">Error: {error}</p>
            ) : (
              <Table columns={columns} data={designation.data} onEditClick={handleEditClick} idKey="idDesignation" />
            )}
          </Card>
        </div>

        <div className="col-lg-4">
          <Card title={editId ? "Update Designation" : "Add Designation"}>
            <form onSubmit={handleSubmit}>
              <Input
                label="Designation Code"
                name="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                maxLength="10"
              />
              <Input
                label="Designation Name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                maxLength="50"
              />
              <RadioButton
                name="overtime"
                options={[{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }]}
                selectedValue={formData.overtime}
                onChange={(value) => handleChange("overtime", value)}
              />
              <div className="text-center">
                <Button type="submit" className="btn btn-primary px-4 me-2">
                  {editId ? "Update" : "Submit"}
                </Button>
                <Button
                  type="reset"
                  className="btn btn-outline-secondary px-4"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Designation;

