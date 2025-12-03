const Cookies = {
    set: (nombre, valor, dias) => {
        let expires = "";
        if (dias) {
            const date = new Date();
            date.setTime(date.getTime() + (dias * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = nombre + "=" + (valor || "")  + expires + "; path=/; SameSite=Lax";
    },

    get: (nombre) => {
        const nameEQ = nombre + "=";
        const ca = document.cookie.split(';');
        for(let i=0;i < ca.length;i++) {
            let c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    },

    remove: (nombre) => {
        document.cookie = nombre + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
};