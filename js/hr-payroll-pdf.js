(function (root) {
    'use strict';
    root.downloadPayrollReceiptPdf = function (response) {
        if (!response || response.status !== 'success' || response.encoding !== 'base64' ||
            typeof response.fileData !== 'string' || !response.fileData) {
            throw new Error('La respuesta no contiene una boleta PDF válida.');
        }
        if (typeof root.atob !== 'function' || typeof root.Blob !== 'function' ||
            !root.URL || typeof root.URL.createObjectURL !== 'function' ||
            !root.document || !root.document.body) {
            throw new Error('El navegador no admite la descarga segura de PDF.');
        }
        var binary;
        try { binary = root.atob(response.fileData); }
        catch (_) { throw new Error('No fue posible decodificar la boleta PDF.'); }
        if (!binary || binary.length < 5) throw new Error('El archivo PDF está vacío o incompleto.');
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        var signature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
        if (signature !== '%PDF-') throw new Error('El contenido recibido no tiene firma PDF válida.');
        var blob = new root.Blob([bytes], { type: 'application/pdf' });
        var objectUrl = root.URL.createObjectURL(blob);
        var anchor = root.document.createElement('a');
        var fileName = String(response.fileName || 'boleta-de-pago.pdf')
            .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-').trim();
        if (!fileName) fileName = 'boleta-de-pago.pdf';
        if (!/\.pdf$/i.test(fileName)) fileName += '.pdf';
        anchor.href = objectUrl;
        anchor.download = fileName;
        anchor.style.display = 'none';
        try {
            root.document.body.appendChild(anchor);
            anchor.click();
        } finally {
            if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
            else if (typeof anchor.remove === 'function') anchor.remove();
            root.setTimeout(function () { root.URL.revokeObjectURL(objectUrl); }, 1000);
        }
        return true;
    };
})(window);
