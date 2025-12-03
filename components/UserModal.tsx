import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    heading?: string
}
const UserModal: React.FC<ModalProps> = ({ isOpen, onClose, children, heading = 'Modal' }) => {

    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <dialog
            className="fixed inset-0 z-50 flex items-center justify-center w-full h-full bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            style={{ opacity: isOpen ? 1 : 0 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                ref={modalRef}
                className="flex flex-col bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300"
                style={{
                    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
                    opacity: isOpen ? 1 : 0,
                }}
            >
                <div className="flex justify-between items-center p-4 border-b border-blue-100">
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight ps-2">
                        {heading.toUpperCase()}
                    </h1>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-blue-50 transition-colors duration-200"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5 text-gray-600 hover:text-blue-600" />
                    </button>
                </div>
                <div className="px-6 py-5 text-gray-700">{children}</div>
            </div>
        </dialog>
    )
}

export default UserModal