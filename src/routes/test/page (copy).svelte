<script>
  const apiUrl = import.meta.env.VITE_API_URL;
  import { onMount } from "svelte";
  import axios from "axios";
  import { page } from "$app/stores";
  import { writable } from "svelte/store";
  import { Form } from "@formio/js";
  
  export let dynamicParams = {};
  
  const formData = writable(dynamicParams); // untuk menyimpan data form yang terkini
  const formErrors = writable([]); // untuk menyimpan error yang terjadi
  const schema = writable(null); // untuk menyimpan schema form
  const eventApi = writable(null); // untuk menyimpan event API
  let isReady = false;
  let formElement; // element form akan di-bind di sini
  let process = "";
  let instance = "";
  let form; // untuk menyimpan instance dari form yang dibuat oleh Formio
  let isSubmitting = false;
  // Track if the change was programmatic
  let isProgrammaticChange = false;
  // Track the previous form data to compare changes
  let previousFormData = {};
  
  // Popup state variables
  let showLoader = false;
  let showSuccessPopup = false;
  let popupMessage = "";
  let loaderTimeout;
  // Modal confirmation variables - MODIFIED: Now for post-submission
  let showPostSubmissionModal = false;
  let postSubmissionMessage = "";
  let postSubmissionColor = "";
    // Back button state
  let isUnclaimingTask = false;

  // Helper function to check if response indicates success
  function isSuccessResponse(response) {
    if (!response) return false;
    
    // Check direct message
    if (response.message === "Event processed successfully") {
      return true;
    }
    
    // Check nested data structure: data.data[0].message
    if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return response.data.data[0].message === "Event processed successfully";
    }
    
    // Check if data.message exists
    if (response.data?.message === "Event processed successfully") {
      return true;
    }
    
    return false;
  }
  
  export let data;
  const sessionData = data.sessionData;
  const token = sessionData.token;
  const users = sessionData.user;
  const groups = sessionData.groups;
  const cmisAuth = sessionData.cmisAuth;

  const processRules = {
    "Mirorim_Operasional.Order.Checking": {
        validate: (submissionData) => {
            if (!submissionData.products || !Array.isArray(submissionData.products)) {
                return null;
            }

            let hasDiscrepancy = false;
            for (const product of submissionData.products) {
                const quantityOrder = parseInt(product.quantity_order) || 0;
                const quantityCheck = parseInt(product.quantity_check) || 0;

                if (quantityOrder !== quantityCheck) {
                    hasDiscrepancy = true;
                    break;
                }
            }

            return {
                hasDiscrepancy,
                message: hasDiscrepancy
                    ? "Invoice ini Lanjut ke proses Wasit"
                    : "Invoice ini Lanjut ke proses Packing",
                color: hasDiscrepancy ? "red" : "green",
            };
        },
    },
    "Mirorim_Operasional.Refill.Compare_Refill": {
        validate: (submissionData) => {
            const quantityApprove = submissionData.quantity_approve || 0;
            const quantityCheck = submissionData.quantity_check || 0;

            if (quantityApprove !== quantityCheck) {
                return {
                    message: "Kembali ke Proses Picker Gudang",
                    color: "red",
                };
            } else {
                return {
                    message: "Lanjut ke Onduty Toko untuk QC Refill",
                    color: "green",
                };
            }
        },
    },
    "Mirorim_Operasional.Refill.QC_Refill": {
        validate: (submissionData) => {
            const quantityApprove = submissionData.quantity_approval || 0;
            const quantityCheck = submissionData.quantity_compare || 0;

            if (quantityApprove !== quantityCheck) {
                return {
                    message: "Kembali ke OnDuty Gudang untuk Adjustment",
                    color: "red",
                };
            } else {
                return {
                    message: "Proses Refill Selesai",
                    color: "green",
                };
            }
        },
    },
  };

function validateProcess(submissionData) {
    const rule = processRules[process];
    if (rule && typeof rule.validate === "function") {
        return rule.validate(submissionData);
    }
    return null;
}

  // Function to validate quantities and determine next process
  function validateQuantities(submissionData) {
    if (!isCheckingProcess() || !submissionData.products || !Array.isArray(submissionData.products)) {
      return null; // No validation needed for non-checking processes
    }

    let hasDiscrepancy = false;

    for (const product of submissionData.products) {
      const quantityOrder = parseInt(product.quantity_order) || 0;
      const quantityCheck = parseInt(product.quantity_check) || 0;
      
      if (quantityOrder !== quantityCheck) {
        hasDiscrepancy = true;
        break;
      }
    }

    return {
      hasDiscrepancy,
      message: hasDiscrepancy 
        ? "Invoice ini Lanjut ke proses Wasit" 
        : "Invoice ini Lanjut ke proses Packing",
      color: hasDiscrepancy ? "red" : "green"
    };
  }

  // MODIFIED: Function to show post-submission modal
  function showPostSubmissionModalWithMessage(submissionData) {
    const validation = validateProcess(submissionData);
    
    if (validation) {
      postSubmissionMessage = validation.message;
      postSubmissionColor = validation.color;
    } else {
      // Default success message for non-checking processes
      postSubmissionMessage = "Data berhasil dikirim";
      postSubmissionColor = "green";
    }
    
    showPostSubmissionModal = true;
  }

  // Function to proceed with actual submission - MODIFIED: No more confirmation modal logic
  async function proceedWithSubmission(submissionData) {
    try {
      isSubmitting = true;
      showLoaderPopup();

      // Tambahkan visual feedback (opsional)
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sedang memproses...";
      }

      // Existing submission logic
      if (Array.isArray(submissionData.file) && submissionData.file.length > 0) {
        try {
          console.log("Memulai proses upload file");
          const formData = new FormData();

          // Menambahkan file ke FormData
          for (const fileData of submissionData.file) {
            console.log("Processing file:", fileData.name);
            const base64Data = fileData.url;
            const mimeType = fileData.type;
            const fileBlob = base64ToBlob(base64Data, mimeType);
            console.log("fileBlob", fileBlob);
            formData.append("file", fileBlob, fileData.name);
          }

          console.log("form data", [...formData.entries()]);

          const requestOptions = {
            method: "POST",
            body: formData,
            redirect: "follow",
          };

          console.log("Attempting to upload to:", `${apiUrl}chemisUpload`);
          console.log("Request options:", {
            method: requestOptions.method,
            credentials: requestOptions.credentials,
          });

          // Melakukan upload dengan timeout
          const timeoutDuration = 30000; // 30 seconds timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

          requestOptions.signal = controller.signal;

          const uploadResponse = await fetch(`${apiUrl}chemisUpload`, requestOptions)
            .finally(() => clearTimeout(timeoutId));

          console.log("response upload", uploadResponse);

          if (!uploadResponse.ok) {
            throw new Error(`Upload gagal dengan status: ${uploadResponse.status} - ${uploadResponse.statusText}`);
          }

          const result = await uploadResponse.text();
          console.log("Upload berhasil:", result);
          
          let eventToSubmit = { ...submissionData };

          // Jika ada file, hanya ambil nama file saja
          if (Array.isArray(submissionData.file) && submissionData.file.length > 0) {
            eventToSubmit.file = submissionData.file.map((fileData) => ({ name: fileData.name }));
          }          // Kirim objek yang sudah dimodifikasi          const submitResponse = await handleEvent("onSubmit", eventToSubmit);
          hideLoaderPopup();
            // Check response for success/failure
          console.log("Submit response received (with file):", submitResponse);
          if (isSuccessResponse(submitResponse)) {
            // MODIFIED: Show post-submission modal for successful submission
            console.log("Success response detected, showing success modal");
            showPostSubmissionModalWithMessage(submissionData);
          } else {
            // Show error modal for failed submission
            console.log("Error response detected:", submitResponse);
            const errorMsg = submitResponse?.message || submitResponse?.data?.message || "Gagal memproses data";
            postSubmissionMessage = errorMsg;
            postSubmissionColor = "red";
            showPostSubmissionModal = true;
          }
        } catch (error) {
          console.error("Error detail:", {
            message: error.message,
            name: error.name,
            stack: error.stack,
          });

          let errorMessage = "Gagal mengupload file: ";

          if (error.name === "AbortError") {
            errorMessage += "Koneksi timeout setelah 30 detik";
          } else if (error.message.includes("net::ERR_CONNECTION_RESET")) {
            errorMessage += "Koneksi ke server terputus. Mohon periksa koneksi internet Anda dan coba lagi";
          } else {
            errorMessage += error.message;
          }          hideLoaderPopup();
          alert(errorMessage);
        }
      } else {// Jika tidak ada file, langsung submit form
        try {
          console.log("Form Submit Event Data:", submissionData);          const submitResponse = await handleEvent("onSubmit", submissionData);
          hideLoaderPopup();
            // Check response for success/failure
          console.log("Submit response received (no file):", submitResponse);
          if (isSuccessResponse(submitResponse)) {
            // MODIFIED: Show post-submission modal for successful submission
            console.log("Success response detected, showing success modal");
            showPostSubmissionModalWithMessage(submissionData);
          } else {
            // Show error modal for failed submission
            console.log("Error response detected:", submitResponse);
            const errorMsg = submitResponse?.message || submitResponse?.data?.message || "Gagal memproses data";
            postSubmissionMessage = errorMsg;
            postSubmissionColor = "red";
            showPostSubmissionModal = true;
          }} catch (error) {
          console.error("Error saat submit form:", error);
          hideLoaderPopup();
          
          // Show error modal for failed submission
          postSubmissionMessage = `Gagal mengirim data: ${error.message}`;
          postSubmissionColor = "red";
          showPostSubmissionModal = true;
        }
      }
    } finally {
      // Reset status submit dan tampilan button
      isSubmitting = false;
      hideLoaderPopup();
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit";
      }
    }
  }
  // MODIFIED: Function to handle post-submission modal - this triggers history back
  function handlePostSubmissionContinue() {
    showPostSubmissionModal = false;
    postSubmissionMessage = "";
    postSubmissionColor = "";
    window.history.back();
  }
  // Function to handle back button with unclaim
  async function handleBackWithUnclaim() {
    if (isUnclaimingTask) return; // Prevent double-click
    
    try {
      isUnclaimingTask = true;
      showLoaderPopup();

      // Get task definition key and instance from URL params
      const params = new URLSearchParams(window.location.search);
      const taskDefinitionKey = params.get("process") || "";
      const instanceParam = params.get("instance") || "";

      if (taskDefinitionKey && instanceParam) {
        // Handle multiple instances (separated by |)
        const instances = instanceParam.includes("|") ? instanceParam.split("|") : [instanceParam];
        
        // Unclaim all instances
        for (const processInstanceId of instances) {
          try {
            const response = await axios.post(
              `${apiUrl}api/task`,
              {
                instance: processInstanceId,
                taskDefinitionKey: taskDefinitionKey,
                userId: users.username,
                status: 0 // 0 for unclaim
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            console.log(`Task unclaimed successfully for instance ${processInstanceId}:`, response.data);
          } catch (instanceError) {
            console.error(`Error unclaiming task for instance ${processInstanceId}:`, instanceError);
          }
        }
        
        showSuccessPopupMessage(`${instances.length} task(s) berhasil di-unclaim`);
      }

    } catch (error) {
      console.error("Error unclaiming task:", error);
      showSuccessPopupMessage(`Error unclaim task: ${error.response?.data?.error || error.message}`);
    } finally {
      isUnclaimingTask = false;
      hideLoaderPopup();
      
      // Go back to previous page after a short delay
      setTimeout(() => {
        window.history.back();
      }, 1000);
    }
  }
  
  function parseCookies() {
    if (typeof document === "undefined") return {};
  
    const cookieObj = {};
    try {
      const cookies =
        typeof document.cookie === "string" ? document.cookie : "";
      cookies.split(";").forEach((cookie) => {
        const [name, value] = cookie.trim().split("=");
        try {
          cookieObj[name.trim()] = decodeURIComponent(value || "");
        } catch (e) {
          console.error("Error parsing cookie:", name);
        }
      });
    } catch (error) {
      console.error("Error in parseCookies:", error);
    }
    return cookieObj;
  }
  
  export function load() {
    const cookies = parseCookies();
    let user = null;
    let baseDn = null;
  
    try {
      // Parse user cookie
      const userCookie = cookies["user"];
      user = userCookie ? JSON.parse(userCookie) : null;
  
      // Parse baseDn cookie
      const baseDnCookie = cookies["baseDn"];
      if (baseDnCookie) {
        // Hapus tanda kutip ganda jika ada
        baseDn = baseDnCookie.replace(/^"|"$/g, "");
      }
    } catch (error) {
      console.error("Error parsing cookies:", error);
    }
  
    const session = user
      ? {
          fid: users.fullName,
          uid: users.username,
          gid: user.groups?.[0]?.name || "default-group",
          baseDn: baseDn, // Menggunakan baseDn dari cookies
          cmisAuth: cmisAuth,
        }
      : null;
  
    return session;
  }
  
  const fetchData = async (url) => {
    try {
      const { data } = await axios.get(url);
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch from ${url}: ${error.message}`);
    }
  };
  
  // Function to find differences between old and new data
  function findChangedFields(oldData, newData, path = '') {
    const changes = {};
    
    // If types don't match or one is null/undefined but not both
    if (typeof oldData !== typeof newData || 
        ((oldData === null) !== (newData === null)) ||
        (oldData === undefined) !== (newData === undefined)) {
      return { [path || 'root']: newData };
    }
    
    // Handle non-objects (primitives)
    if (typeof oldData !== 'object' || oldData === null) {
      if (oldData !== newData) {
        return { [path || 'root']: newData };
      }
      return {};
    }
    
    // Handle arrays
    if (Array.isArray(oldData)) {
      if (!Array.isArray(newData) || oldData.length !== newData.length) {
        return { [path || 'root']: newData };
      }
      
      let arrayChanged = false;
      for (let i = 0; i < oldData.length; i++) {
        if (JSON.stringify(oldData[i]) !== JSON.stringify(newData[i])) {
          arrayChanged = true;
          break;
        }
      }
      
      if (arrayChanged) {
        return { [path || 'root']: newData };
      }
      return {};
    }
    
    // Handle objects
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Key exists in new but not in old or vice versa
      if (!(key in oldData) || !(key in newData)) {
        changes[currentPath] = (key in newData) ? newData[key] : undefined;
        continue;
      }
      
      // Both have the key, check if values differ
      const childChanges = findChangedFields(oldData[key], newData[key], currentPath);
      Object.assign(changes, childChanges);
    }
    
    return changes;
  }
  
  // Convert dot notation paths back to a nested object
  function pathsToNestedObject(paths) {
    const result = {};
    
    for (const [path, value] of Object.entries(paths)) {
      if (path === 'root') {
        return value; // If the entire object changed, just return it
      }
      
      const parts = path.split('.');
      let current = result;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      
      current[parts[parts.length - 1]] = value;
    }
    
    return result;
  }
  
  // Show the loader popup
  function showLoaderPopup() {
    showLoader = true;
    // Set a timeout to auto-hide the loader if it takes too long
    loaderTimeout = setTimeout(() => {
      hideLoaderPopup();
      showSuccessPopupMessage("Proses timeout, silakan coba lagi.");
    }, 30000); // 30 second timeout
  }

  // Hide the loader popup
  function hideLoaderPopup() {
    showLoader = false;
    if (loaderTimeout) {
      clearTimeout(loaderTimeout);
      loaderTimeout = null;
    }
  }

  // Show success popup with a message
  function showSuccessPopupMessage(message) {
    popupMessage = message;
    showSuccessPopup = true;
    // Auto-hide success popup after 3 seconds
    setTimeout(() => {
      showSuccessPopup = false;
    }, 3000);
  }
    const handleEvent = async (eventType, submissionData = {}) => {
  let api;
  eventApi.subscribe((value) => {
    api = value;
  });

  // Validasi API dan event
  if (!api || !api[eventType]) return null;

  const { method, endpoint } = api[eventType];
  const isChangeEvent = eventType === 'onChange';

  const dataForm = {
    event: submissionData,
    eventKey: eventType,
    partialUpdate: isChangeEvent,
  };

  console.log(`Sending ${eventType} with data:`, dataForm);

  try {
    isProgrammaticChange = true;

    // if (isChangeEvent) {
    //   showLoaderPopup();
    // }

    const { data: submitResponse } = await axios({
      url: `${endpoint}?process=${process}`,
      method,
      headers: { "Content-Type": "application/json" },
      data: dataForm,
    });

    console.log("submitResponse", submitResponse);

    if (eventType === "onChange") {
      const newSchemaComponents = submitResponse.schema;
    // if(newSchemaComponents.lenth)
      console.log("New schema components:", newSchemaComponents);
      console.log("Current form:", form);

      // For every component in the new schema
      newSchemaComponents.forEach((newComp) => {
        // Find matching component in current form by key
        const matchingComponent = form.getComponent(newComp.key);

        if (matchingComponent) {
          console.log(`Found matching component "${newComp.key}"`);
          
          // Special handling for select components to update data values
          if (newComp.type === "select" && Array.isArray(newComp.data?.values)) {
            // Get the component instance
            const componentInstance = form.getComponent(newComp.key);
            
            if (componentInstance) {
              // Update the component's data values
              componentInstance.component.data = {
                ...(componentInstance.component.data || {}),
                values: newComp.data.values
              };
              
              // Update items in the dropdown
              if (typeof componentInstance.setItems === 'function') {
                componentInstance.setItems(newComp.data.values);
              }
              
              console.log(`Updated select options for "${newComp.key}":`, newComp.data.values);
            }
          }
          
          // Handle default value - SAFER APPROACH
          if (typeof newComp.defaultValue !== "undefined") {
            try {
              // Check if the component is meant to be read-only 
              // (like label_product_name which appears to be disabled)
              if (newComp.input === false || newComp.disabled === true) {
                // For read-only/disabled components, update the component data directly
                if (matchingComponent.data) {
                  matchingComponent.data[newComp.key] = newComp.defaultValue;
                }
                
                // For text display components, set the content directly if possible
                if (matchingComponent.content) {
                  matchingComponent.content = newComp.defaultValue;
                }
                
                // Update the label if appropriate
                if (newComp.label) {
                  matchingComponent.component.label = newComp.label;
                }
                
                console.log(`Updated read-only value for "${newComp.key}" to:`, newComp.defaultValue);
              } else {
                // For input components, use setValue normally
                form.setValue(newComp.key, newComp.defaultValue);
                console.log(`Set value for "${newComp.key}" to:`, newComp.defaultValue);
              }
            } catch (err) {
              console.warn(`Error setting value for "${newComp.key}":`, err);
              
              // Fallback: try setting the value directly in the submission data
              try {
                if (!form.submission) form.submission = { data: {} };
                if (!form.submission.data) form.submission.data = {};
                form.submission.data[newComp.key] = newComp.defaultValue;
                console.log(`Set value in submission data for "${newComp.key}":`, newComp.defaultValue);
              } catch (submissionErr) {
                console.error(`Failed to set value in submission for "${newComp.key}":`, submissionErr);
              }
            }
          }
          
          // Update component definition in the form schema
          // This uses Formio's component modification methods when possible
          const formComponents = form.components || [];
          for (let i = 0; i < formComponents.length; i++) {
            const component = formComponents[i];
            if (component && component.component && component.component.key === newComp.key) {
              // Update properties while preserving the component instance
              Object.keys(newComp).forEach(property => {
                if (property !== 'id' && property !== 'key') {
                  component.component[property] = newComp[property];
                }
              });
              
              // Try to refresh the component if a method exists
              if (typeof component.rebuild === 'function') {
                component.rebuild();
              } else if (typeof component.redraw === 'function') {
                component.redraw();
              }
              
              break;
            }
          }
        } else {
          console.log(`Component "${newComp.key}" not found in current form`);
        }
      });
      
      // Refresh the whole form if needed
      if (typeof form.build === 'function') {
        form.build();
      } else {
        console.log("Form rebuild method not available, components updated individually");
      }      console.log("Form schema and values updated");
    }
      // Return the response for onSubmit events
    if (eventType === "onSubmit") {
      return submitResponse;
    }
    
    // Tambahkan penanganan untuk respons di sini jika perlu
  } catch (error) {
    const errorMessage = error.response?.data || error.message || "Unknown error";

    formErrors.update((errors) => [
      ...errors,
      { event: eventType, error: errorMessage },
    ]);

    console.error("Form submission error:", errorMessage);

    if (isChangeEvent) {
      hideLoaderPopup();
      showSuccessPopupMessage(`Error: ${errorMessage}`);
    }

    // Return error information for onSubmit events
    if (eventType === "onSubmit") {
      return {
        success: false,
        message: typeof errorMessage === 'string' ? errorMessage : 'Gagal memproses data'
      };
    }
  } finally {
    // Reset flag setelah perubahan programatik selesai
    setTimeout(() => {
      isProgrammaticChange = false;
    }, 10);
  }
  
  return null;
};

  
  onMount(async () => {
    console.log("session", load());
  
    const params = new URLSearchParams($page.url.search);
    process = params.get("process") || "defaultForm";
    instance = params.get("instance") || "";
  
    if (!formElement) {
      console.error("Form element is not bound");
      return;
    }
  
    try {
      const session = load();
  
      if (!session) {
        throw new Error("No valid session found");
      }

      // Show loading state while fetching schema
      showLoaderPopup();
  
      // Fetch schema and event API
      const formUrl = await axios.post(
        `${apiUrl}dynamicRender`,
        { session },
        { params: { process, instance } }
      );
  
      console.log("formUrl", formUrl);
  
      const fetchedSchema = formUrl.data.data.schema;
      console.log("fetchedSchema", fetchedSchema);
      const fetchedEventApi = formUrl.data.data.event;
  
      if (!fetchedSchema || typeof fetchedSchema !== "object") {
        throw new Error("Invalid or missing schema");
      }
  
      schema.set(fetchedSchema);
      eventApi.set(fetchedEventApi);
  
      // Render Form.io form
      Formio.createForm(formElement, fetchedSchema).then((formInstance) => {
        form = formInstance;
        form.submission = { data: fetchedSchema.data };
        
        // Initialize previous form data
        previousFormData = { ...fetchedSchema.data };
  
        form.on("change", (event) => {
          // Only process the change if it wasn't programmatic
          if (!isProgrammaticChange) {
            // Find what actually changed
            const changedFields = findChangedFields(previousFormData, event.data);
            
            // Convert paths back to a nested object structure
            const changedData = pathsToNestedObject(changedFields);
            
            // Only proceed if there were actual changes
            if (Object.keys(changedFields).length > 0) {
              console.log("Changed data only:", changedData);
              
              // Update the store with the full data
              formData.set(event.data);
              
              // But only send the changed data to the API
              handleEvent("onChange", changedData);
              
              // Update previous data with the current data
              previousFormData = { ...event.data };
            }
          }
        });
  
        form.on("submit", async (event) => {
          // Cek apakah sedang dalam proses submit
          if (isSubmitting) {
            alert("Permintaan sedang diproses, mohon tunggu...");
            return;
          }
  
          if (!event || typeof event !== "object") {
            alert("Data form tidak valid.");
            return;
          }

          // Memeriksa field kosong
          const emptyFields = Object.keys(event).filter((key) => {
            const value = event[key];
            return (
              value === null || value === undefined || value === ""
              // (Array.isArray(value) && value.length === 0) // Validasi array kosong
              // (typeof value === 'object' && Object.keys(value).length === 0) // Validasi object kosong
            );
          });

          if (emptyFields.length > 0) {
            alert(
              "Ada data yang belum diisi: " +
                emptyFields.join(", ").replace(/_/g, " ")
            );
            return;
          }

          console.log("event", event);

          // MODIFIED: Always proceed with submission directly, no pre-confirmation
          proceedWithSubmission(event);
        });
  
        form.on("error", (errors) => {
          console.error("Form Errors:", errors);
          formErrors.set(errors);
          hideLoaderPopup();
        });
  
        isReady = true;
        hideLoaderPopup();
        showSuccessPopupMessage("Form berhasil dimuat");
      });
    } catch (error) {
      console.error("Error during form setup:", error.message);
      formErrors.update((errors) => [
        ...errors,
        { event: "Resource Loading", error: error.message },
      ]);
      hideLoaderPopup();
      alert(`Error: ${error.message}`);
    }
  });
  
  function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64.split(",")[1]);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);
  
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      byteArrays.push(new Uint8Array(byteNumbers));
    }
  
    return new Blob(byteArrays, { type: mimeType });
  }
</script>

<h1 class="h4 font-bold text-center">
  {(() => {
    const parts = process.split(".");
    if (parts.length === 2) {
      // Contoh: Mirorim_Operasional.Order → jadi "Mirorim Operasional Order"
      return parts
        .join(" ")
        .replace(/[._]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } else if (parts.length >= 3) {
      // Contoh: Mirorim_Operasional.Order.Load_Data → jadi "Load Data"
      const lastPart = parts[parts.length - 1];
      return lastPart
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } else {
      // Jika tidak ada titik
      return process
        .replace(/[._]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  })()}
</h1>

<div bind:this={formElement}></div>

<!-- Back Button -->
<div class="mt-6 flex justify-center">
  <button
    type="button"
    class="px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
    class:opacity-50={isUnclaimingTask}
    disabled={isUnclaimingTask}
    on:click={handleBackWithUnclaim}
  >
    {#if isUnclaimingTask}
      <svg class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      Sedang unclaim...
    {:else}
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
      Kembali
    {/if}
  </button>
</div>

<!-- Post-Submission Modal - MODIFIED: Now shows after successful submission -->
{#if showPostSubmissionModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-8 rounded-lg shadow-lg w-96 max-w-md mx-4">
      <div class="text-center">
        <!-- Icon based on post submission color -->
        {#if postSubmissionColor === "green"}
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        {:else}
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
        {/if}
        
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          {#if postSubmissionColor === "green"}
            Berhasil Submit!
          {:else}
            Gagal Submit!
          {/if}
        </h3>
        
        <p class="text-sm text-gray-500 mb-6" class:text-green-600={postSubmissionColor === "green"} class:text-red-600={postSubmissionColor === "red"}>
          {postSubmissionMessage}
        </p>
        
        <div class="flex justify-center">
          <button
            type="button"
            class="px-6 py-2 rounded-lg text-white transition-colors bg-blue-600 hover:bg-blue-700"
            on:click={handlePostSubmissionContinue}
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Loader Popup -->
{#if showLoader}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-8 rounded-lg shadow-lg w-64 text-center">
      <div class="loading-spinner mb-4 mx-auto"></div>
      <p class="text-gray-700">Sedang memproses...</p>
      <p class="text-sm text-gray-500 mt-2">Harap tunggu</p>
    </div>
  </div>
{/if}

<!-- Success Popup -->
{#if showSuccessPopup}
  <div class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-40 animate-bounce">
    <div class="flex items-center">
      <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>{popupMessage}</span>
    </div>
  </div>
{/if}

