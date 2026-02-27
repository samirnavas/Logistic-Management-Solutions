import React from 'react';

export default function TableSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <>
            {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-gray-100 last:border-0">
                    {[...Array(columns)].map((_, j) => (
                        <td key={j} className="px-6 py-6">
                            <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
