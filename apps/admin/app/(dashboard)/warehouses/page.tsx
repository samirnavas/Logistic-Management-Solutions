'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import TableSkeleton from '../../components/TableSkeleton';
import TableEmptyState from '../../components/TableEmptyState';
// import axios from 'axios'; // Removing axios dependency

interface Warehouse {
    _id: string;
    name: string;
    code: string;
    address: {
        addressLine: string;
        city: string;
        state: string;
        country: string;
        zip: string;
    };
    contact: {
        name: string;
        phone: string;
        email: string;
    };
    isActive: boolean;
}

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        addressIndex: '', // Separate fields for address
        addressLine: '',
        city: '',
        state: '',
        country: '',
        zip: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        isActive: true
    });

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            console.log('Fetching warehouses from:', `${process.env.NEXT_PUBLIC_API_URL}/warehouses/admin/all`);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            if (data.success) {
                setWarehouses(data.data);
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (warehouse?: Warehouse) => {
        if (warehouse) {
            setEditingId(warehouse._id);
            setFormData({
                name: warehouse.name,
                code: warehouse.code,
                addressIndex: '',
                addressLine: warehouse.address.addressLine,
                city: warehouse.address.city,
                state: warehouse.address.state,
                country: warehouse.address.country,
                zip: warehouse.address.zip,
                contactName: warehouse.contact?.name || '',
                contactPhone: warehouse.contact?.phone || '',
                contactEmail: warehouse.contact?.email || '',
                isActive: warehouse.isActive
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                code: '',
                addressIndex: '',
                addressLine: '',
                city: '',
                state: '',
                country: '',
                zip: '',
                contactName: '',
                contactPhone: '',
                contactEmail: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const payload = {
                name: formData.name,
                code: formData.code,
                address: {
                    addressLine: formData.addressLine,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    zip: formData.zip
                },
                contact: {
                    name: formData.contactName,
                    phone: formData.contactPhone,
                    email: formData.contactEmail
                },
                isActive: formData.isActive
            };

            const headers = {
                'Authorization': `Bearer ${token || ''}`,
                'Content-Type': 'application/json'
            };

            console.log('Submitting payload:', JSON.stringify(payload, null, 2));

            if (editingId) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/${editingId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            } else {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
                    throw new Error(errorData.message || 'Failed to create warehouse');
                }
            }

            setIsModalOpen(false);
            fetchWarehouses();
        } catch (error: any) {
            console.error('Error saving warehouse:', error);
            alert(error.message || 'Failed to save warehouse. Check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this warehouse?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchWarehouses();
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            alert('Failed to delete warehouse.');
        }
    };

    const filteredWarehouses = warehouses.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.address.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
                    <p className="text-gray-500">Manage your warehouse locations</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm shadow-blue-200"
                >
                    <Plus size={18} />
                    Add Warehouse
                </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search warehouses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Warehouse List */}
            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 border-collapse">
                        <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <TableSkeleton columns={5} />
                            ) : warehouses.length === 0 ? (
                                <TableEmptyState
                                    colSpan={5}
                                    title="No warehouses found"
                                    description="Get started by adding your first warehouse location."
                                    actionLabel="Add Warehouse"
                                    onAction={() => handleOpenModal()}
                                />
                            ) : filteredWarehouses.length === 0 ? (
                                <TableEmptyState
                                    colSpan={5}
                                    title="No results"
                                    description="No warehouses match your search terms."
                                />
                            ) : (
                                filteredWarehouses.map(warehouse => (
                                    <tr key={warehouse._id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-sky-700">{warehouse.code}</td>
                                        <td className="px-6 py-4 text-gray-800 font-medium">{warehouse.name}</td>
                                        <td className="px-6 py-4">
                                            {warehouse.address.city}, {warehouse.address.country}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={warehouse.isActive ? 'ACTIVE' : 'INACTIVE'} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap sm:flex-nowrap">
                                                <button
                                                    onClick={() => handleOpenModal(warehouse)}
                                                    className="p-2 text-gray-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(warehouse._id)}
                                                    className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Edit Warehouse' : 'Add New Warehouse'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* General Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Warehouse Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. New York Hub"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Code</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g. NY-001"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Location Details</h3>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Address Line</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.addressLine}
                                        onChange={e => setFormData({ ...formData, addressLine: e.target.value })}
                                        placeholder="123 Logistics Ave"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">City</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">State/Province</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Country</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.country}
                                            onChange={e => setFormData({ ...formData, country: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">ZIP Code</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.zip}
                                            onChange={e => setFormData({ ...formData, zip: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info (Optional) */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contact Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Manager Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                            value={formData.contactName}
                                            onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Phone</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                            value={formData.contactPhone}
                                            onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                            value={formData.contactEmail}
                                            onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700 font-medium">
                                    Active (Visible to Clients)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {editingId ? 'Save Changes' : 'Create Warehouse'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
