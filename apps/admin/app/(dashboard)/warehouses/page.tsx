'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, CheckCircle, XCircle } from 'lucide-react';
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
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading warehouses...</p>
                </div>
            ) : filteredWarehouses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No warehouses found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">
                        Get started by adding your first warehouse location.
                    </p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-6 text-blue-600 font-medium hover:text-blue-700 hover:underline"
                    >
                        Add Warehouse
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWarehouses.map(warehouse => (
                        <div key={warehouse._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {warehouse.code.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{warehouse.name}</h3>
                                            <p className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                {warehouse.code}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenModal(warehouse)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(warehouse._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="text-gray-400 mt-0.5 shrink-0" size={16} />
                                        <p className="text-sm text-gray-600">
                                            {warehouse.address.addressLine}<br />
                                            {warehouse.address.city}, {warehouse.address.state} {warehouse.address.zip}<br />
                                            {warehouse.address.country}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                                    <span>
                                        Status:
                                        {warehouse.isActive ? (
                                            <span className="text-green-600 font-medium ml-1">Active</span>
                                        ) : (
                                            <span className="text-gray-400 font-medium ml-1">Inactive</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
