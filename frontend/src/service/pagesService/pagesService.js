export const deleteCustomer = async (customerId) => {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/events/customers/${customerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          "Content-Type": "application/json",
        },
      });
  
      return response;
  };

  export const ArchiveCustomer = async (customerId) => {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/customers/${customerId}/archive`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archived: true }),
      }
    );

    return response;
  };

  export const fetchCustomerProfile = async (customerId) => {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/events/customers/${customerId}/profile`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        },
      }
    );
    return response;
  };

  export const createOrUpdateCustomer = async (customer, additionalAlternatives, customerId = null) => {
    const url = customerId
      ? `${process.env.REACT_APP_API_URL}/events/customers/${customerId}`
      : `${process.env.REACT_APP_API_URL}/events/create-customer`;
    const method = customerId ? "PUT" : "POST";
  
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...customer, additionalAlternatives }),
    });
  
    return response;
  };

  export const fetchSavedCalendars = async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/events/calendars/saved`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
      },
    });

    return response.ok ? response.json() : [];
  };

  export const fetchCustomers = async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/events/customers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authentication_token")}`,
        "Content-Type": "application/json",
      },
    });
  
    return response.json();
  };