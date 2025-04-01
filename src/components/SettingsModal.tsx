import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Settings, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ApiKeys {
  INSTANTLY_API_KEY: string;
  OPENAI_API_KEY: string;
  ASSISTANT_ID: string;
  INSTANTLY_BASE_URL: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

export function SettingsModal({ isOpen, onClose, apiKeys, onSave }: SettingsModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newKeys = {
      INSTANTLY_API_KEY: formData.get('INSTANTLY_API_KEY') as string,
      OPENAI_API_KEY: formData.get('OPENAI_API_KEY') as string,
      ASSISTANT_ID: formData.get('ASSISTANT_ID') as string,
      INSTANTLY_BASE_URL: formData.get('INSTANTLY_BASE_URL') as string,
    };
    onSave(newKeys);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-gray-800/90 backdrop-blur-sm p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                <Dialog.Title as="div" className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-200 flex items-center">
                    <Settings className="h-5 w-5 text-blue-400 mr-2" />
                    Impostazioni API
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="INSTANTLY_API_KEY" className="block text-sm font-medium text-gray-300 mb-1">
                      Chiave API Instantly
                    </label>
                    <input
                      type="password"
                      name="INSTANTLY_API_KEY"
                      id="INSTANTLY_API_KEY"
                      defaultValue={apiKeys.INSTANTLY_API_KEY}
                      className="w-full px-3 py-2 bg-gray-700/50 rounded-lg border border-gray-600 text-gray-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="OPENAI_API_KEY" className="block text-sm font-medium text-gray-300 mb-1">
                      Chiave API OpenAI
                    </label>
                    <input
                      type="password"
                      name="OPENAI_API_KEY"
                      id="OPENAI_API_KEY"
                      defaultValue={apiKeys.OPENAI_API_KEY}
                      className="w-full px-3 py-2 bg-gray-700/50 rounded-lg border border-gray-600 text-gray-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="ASSISTANT_ID" className="block text-sm font-medium text-gray-300 mb-1">
                      ID Assistente
                    </label>
                    <input
                      type="text"
                      name="ASSISTANT_ID"
                      id="ASSISTANT_ID"
                      defaultValue={apiKeys.ASSISTANT_ID}
                      className="w-full px-3 py-2 bg-gray-700/50 rounded-lg border border-gray-600 text-gray-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="INSTANTLY_BASE_URL" className="block text-sm font-medium text-gray-300 mb-1">
                      URL Base Instantly
                    </label>
                    <input
                      type="text"
                      name="INSTANTLY_BASE_URL"
                      id="INSTANTLY_BASE_URL"
                      defaultValue={apiKeys.INSTANTLY_BASE_URL}
                      className="w-full px-3 py-2 bg-gray-700/50 rounded-lg border border-gray-600 text-gray-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      className={cn(
                        "w-full flex items-center justify-center px-4 py-2",
                        "bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/30",
                        "hover:bg-blue-500/20 transition-all duration-200"
                      )}
                    >
                      Salva Impostazioni
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}