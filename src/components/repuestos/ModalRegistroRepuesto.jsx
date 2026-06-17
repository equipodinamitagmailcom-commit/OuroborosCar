import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig.js';
import PropTypes from 'prop-types';

const ModalRegistroRepuesto = ({ mostrar, manejarCierre, alGuardar, notificar }) => {
    const [nuevoRepuesto, setNuevoRepuesto] = useState({
        nombre: '',
        descripcion: '',
        precio_repuesto: '',
        id_categoria: '',
    });
    const [categorias, setCategorias] = useState([]);
    const [archivo, setArchivo] = useState(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const bucketName = 'repuestos_imagenes';

    useEffect(() => {
        const cargarCategorias = async () => {
            const { data, error: catError } = await supabase
                .from('categoriarepuesto')
                .select('*')
                .order('nombre', { ascending: true });
            if (!catError) setCategorias(data || []);
        };
        if (mostrar) cargarCategorias();
    }, [mostrar]);

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setNuevoRepuesto((prev) => ({ ...prev, [name]: value }));
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

        if (!nuevoRepuesto.nombre.trim() || !nuevoRepuesto.id_categoria) {
            setError('El nombre y la categoría son obligatorios.');
            return;
        }

        setCargando(true);
        try {
            let urlFoto = null;
            if (archivo) {
                const nombreArchivo = `${Date.now()}_${archivo.name}`;
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(nombreArchivo, archivo);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(nombreArchivo);
                urlFoto = urlData.publicUrl;
            }

            const { error: dbError } = await supabase
                .from('repuestos')
                .insert([{
                    nombre: nuevoRepuesto.nombre.trim(),
                    descripcion: nuevoRepuesto.descripcion.trim(),
                    precio_repuesto: nuevoRepuesto.precio_repuesto ? parseFloat(nuevoRepuesto.precio_repuesto) : null,
                    id_categoria: parseInt(nuevoRepuesto.id_categoria),
                    foto: urlFoto
                }]);

            if (dbError) throw dbError;

            notificar('Repuesto registrado correctamente.', 'success');
            alGuardar();
            manejarCierre();
            setNuevoRepuesto({ nombre: '', descripcion: '', precio_repuesto: '', id_categoria: '' });
            setArchivo(null);
        } catch (err) {
            setError(err.message);
            notificar('Error al registrar repuesto.', 'error');
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={manejarCierre} centered contentClassName="modal-custom">
            <Modal.Header closeButton closeVariant="white">
                <Modal.Title className="text-gold">Registrar Nuevo Repuesto</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={manejarEnvio}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre del Repuesto</Form.Label>
                        <Form.Control type="text" name="nombre" value={nuevoRepuesto.nombre} onChange={manejarCambio} className="input-premium" required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Categoría</Form.Label>
                        <Form.Select name="id_categoria" value={nuevoRepuesto.id_categoria} onChange={manejarCambio} className="input-premium" required>
                            <option value="">Seleccione una categoría</option>
                            {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Precio</Form.Label>
                        <Form.Control type="number" step="0.01" name="precio_repuesto" value={nuevoRepuesto.precio_repuesto} onChange={manejarCambio} className="input-premium" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control as="textarea" rows={3} name="descripcion" value={nuevoRepuesto.descripcion} onChange={manejarCambio} className="input-premium" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Imagen del Repuesto</Form.Label>
                        <Form.Control type="file" accept="image/*" onChange={manejarCambioArchivo} className="input-premium" />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="btn-primary-custom w-100" disabled={cargando}>
                        {cargando ? 'Guardando...' : 'Guardar Repuesto'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

ModalRegistroRepuesto.propTypes = { mostrar: PropTypes.bool.isRequired, manejarCierre: PropTypes.func.isRequired, alGuardar: PropTypes.func.isRequired, notificar: PropTypes.func.isRequired };
export default ModalRegistroRepuesto;