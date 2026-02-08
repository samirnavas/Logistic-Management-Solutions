const axios = require('axios');

async function testCreateWarehouse() {
    try {
        const payload = {
            name: "Test Warehouse " + Date.now(),
            code: "TW-" + Date.now(),
            address: {
                addressLine: "123 Test St",
                city: "Test City",
                state: "Test State",
                country: "Test Country",
                zip: "12345"
            },
            contact: {
                name: "Test Manager",
                phone: "123-456-7890",
                email: "manager@test.com"
            },
            isActive: true
        };

        console.log("Sending payload:", JSON.stringify(payload, null, 2));

        const res = await axios.post('http://localhost:5000/api/warehouses', payload);
        console.log("Response status:", res.status);
        console.log("Response data:", res.data);
    } catch (error) {
        if (error.response) {
            console.error("Error Response:", error.response.status, error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

testCreateWarehouse();
