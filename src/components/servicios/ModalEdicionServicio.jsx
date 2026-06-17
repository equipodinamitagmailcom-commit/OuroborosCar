import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import PropTypes from 'prop-types';

const ModalEdicionServicio = ({ mostrar, manejarCierre, servicio, alActualizar, notificar }) => {
    const [servicioEditado, setServicioEditado] = useState({
        tipo_servicio: '',
        precio_servicio: '',
    });
    const [archivo, setArchivo] = useState(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const bucketName = 'servicio_imagenes';

    useEffect(() => {
        if (servicio) {
            setServicioEditado({
                tipo_servicio: servicio.tipo_servicio || '',
                precio_servicio: servicio.precio_servicio != null ? String(servicio.precio_servicio) : '',
            });
        }
    }, [servicio]);

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setServicioEditado((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const manejarCambioArchivo = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setArchivo(file);
        }
    };

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setError('');

        if (!servicioEditado.tipo_servicio.trim()) {
            setError('El tipo de servicio es obligatorio.');
            return;
        }
        if (servicioEditado.precio_servicio && isNaN(parseFloat(servicioEditado.precio_servicio))) {
            setError('El precio debe ser un número válido.');
            return;
        }

        setCargando(true);
        try {
            let urlFoto = servicio.foto;

            if (archivo) {
                const nombreArchivo = `${Date.now()}_${archivo.name}`;
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(nombreArchivo, archivo);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(nombreArchivo);
                
                // Eliminar foto antigua si existe y se está reemplazando
                if (servicio.foto) {
                    const oldFileName = servicio.foto.split('/').pop().split('?')[0];
                    await supabase.storage.from(bucketName).remove([oldFileName]).catch(e => console.warn(e));
                }
                
                urlFoto = urlData.publicUrl;
            }

            const { error: supabaseError } = await supabase
                .from('mantenimientoservicio')
                .update({
                    tipo_servicio: servicioEditado.tipo_servicio.trim(),
                    precio_servicio: servicioEditado.precio_servicio ? parseFloat(servicioEditado.precio_servicio) : null,
                    foto: urlFoto,
                })
                .eq('id_servicio', servicio.id_servicio);

            if (supabaseError) throw supabaseError;

            notificar('Servicio actualizado exitosamente.', 'exito');
            alActualizar();
            manejarCierre();
            setArchivo(null);
        } catch (err) {
            console.error('Error al actualizar servicio:', err.message);
            setError('Error al actualizar el servicio: ' + err.message);
            notificar('Error al actualizar servicio.', 'error');
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered>
            <Modal.Header closeButton>
                <Modal.Title className="text-gold">Editar Servicio</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={manejarEnvio}>
                    <Form.Group className="mb-3">
                        <Form.Label>Tipo de Servicio</Form.Label>
                        <Form.Control type="text" name="tipo_servicio" value={servicioEditado.tipo_servicio} onChange={manejarCambio} className="input-premium" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Precio (Opcional)</Form.Label>
                        <Form.Control type="number" step="0.01" name="precio_servicio" value={servicioEditado.precio_servicio} onChange={manejarCambio} className="input-premium" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Imagen del Servicio</Form.Label>
                        {servicio?.foto && (
                            <div className="mb-2">
                                <img src={servicio.foto} alt="Actual" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                                <p className="small text-muted mb-0">Imagen actual</p>
                            </div>
                        )}
                        <Form.Control type="file" accept="image/*" onChange={manejarCambioArchivo} className="input-premium" />
                        <Form.Text className="text-muted">Si seleccionas un archivo, reemplazará la imagen actual.</Form.Text>
                    </Form.Group>
                    <Button variant="primary" type="submit" className="btn-primary-custom w-100" disabled={cargando}>
                        {cargando ? 'Actualizando...' : 'Guardar Cambios'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

ModalEdicionServicio.propTypes = { mostrar: PropTypes.bool.isRequired, manejarCierre: PropTypes.func.isRequired, servicio: PropTypes.object, alActualizar: PropTypes.func.isRequired, notificar: PropTypes.func.isRequired, };

export default ModalEdicionServicio;