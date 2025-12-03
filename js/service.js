const API_BASE_URL = 'http://100.31.17.110:7001';

const ApiService = {
    
    /**
     * Método genérico para realizar peticiones fetch
     * @param {string} endpoint - La ruta (ej: '/registro' o '/cliente/cita/mias')
     * @param {string} method - GET, POST, PUT, DELETE
     * @param {object} body - Datos a enviar (opcional)
     */
    async request(endpoint, method = 'GET', body = null) {
        
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: method,
            headers: headers
        };

        if (body && method !== 'GET') {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const textResponse = await response.text();
            
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                data = textResponse;
            }

            if (!response.ok) {
                const errorMessage = (typeof data === 'object' && data.message) ? data.message : data;
                throw new Error(errorMessage || `Error ${response.status}: ${response.statusText}`);
            }

            return data;

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, 'GET');
    },

    post(endpoint, body) {
        return this.request(endpoint, 'POST', body);
    },

    put(endpoint, body) {
        return this.request(endpoint, 'PUT', body);
    },

    delete(endpoint) {
        return this.request(endpoint, 'DELETE');
    }
};