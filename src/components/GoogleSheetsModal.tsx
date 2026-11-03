import { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  Plus,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  Table,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { EconomicEntity } from '../types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from '../services/googleAuth';
import {
  createComparisonSpreadsheet,
  listUserSpreadsheets,
  getSpreadsheetMetadata,
  readSpreadsheetValues,
  appendComparisonToSpreadsheet,
  DriveFileItem,
  SpreadsheetMetadata,
} from '../services/googleSheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

type ModalTab = 'create' | 'append' | 'preview';

export function GoogleSheetsModal({
  isOpen,
  onClose,
  entityA,
  entityB,
}: GoogleSheetsModalProps) {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<ModalTab>('create');

  // Create tab state
  const [customTitle, setCustomTitle] = useState(
    `Economic Comparison - ${entityA.name} vs ${entityB.name} (${new Date().toISOString().split('T')[0]})`
  );
  const [incTrajectory, setIncTrajectory] = useState(true);
  const [incSectors, setIncSectors] = useState(true);
  const [incMilestones, setIncMilestones] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    id: string;
    url: string;
    title: string;
  } | null>(null);

  // Append tab state
  const [recentFiles, setRecentFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  const [sheetMetadata, setSheetMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [selectedSheetTitle, setSelectedSheetTitle] = useState('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isAppending, setIsAppending] = useState(false);
  const [appendSuccessMessage, setAppendSuccessMessage] = useState<string | null>(null);
  const [showAppendConfirmDialog, setShowAppendConfirmDialog] = useState(false);

  // Preview tab state
  const [previewValues, setPreviewValues] = useState<(string | number)[][]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // General error banner
  const [statusError, setStatusError] = useState<string | null>(null);

  // Update title when entities change
  useEffect(() => {
    setCustomTitle(
      `Economic Comparison - ${entityA.name} vs ${entityB.name} (${new Date().toISOString().split('T')[0]})`
    );
  }, [entityA, entityB]);

  // Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch recent files when accessToken becomes available
  useEffect(() => {
    if (accessToken && isOpen) {
      loadRecentSpreadsheets(accessToken);
    }
  }, [accessToken, isOpen]);

  const loadRecentSpreadsheets = async (token: string) => {
    setIsLoadingRecent(true);
    try {
      const files = await listUserSpreadsheets(token);
      setRecentFiles(files);
      if (files.length > 0 && !selectedSpreadsheetId) {
        setSelectedSpreadsheetId(files[0].id);
        fetchTabsForId(token, files[0].id);
      }
    } catch (err: any) {
      console.warn('Could not load recent spreadsheets:', err);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const fetchTabsForId = async (token: string, id: string) => {
    if (!id.trim()) return;
    setIsLoadingMetadata(true);
    setStatusError(null);
    try {
      const meta = await getSpreadsheetMetadata(token, id);
      setSheetMetadata(meta);
      if (meta.sheets.length > 0) {
        setSelectedSheetTitle(meta.sheets[0].title);
      }
    } catch (err: any) {
      setStatusError(`Could not inspect spreadsheet: ${err.message || err}`);
      setSheetMetadata(null);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      setUser(res.user);
      setAccessToken(res.accessToken);
      loadRecentSpreadsheets(res.accessToken);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setRecentFiles([]);
    setSheetMetadata(null);
    setCreatedResult(null);
  };

  // Helper to ensure valid access token before calling APIs
  const ensureToken = async (): Promise<string> => {
    if (accessToken) return accessToken;
    const cached = await getAccessToken();
    if (cached) {
      setAccessToken(cached);
      return cached;
    }
    // Need interactive login
    const res = await googleSignIn();
    setUser(res.user);
    setAccessToken(res.accessToken);
    return res.accessToken;
  };

  // 1. Create New Spreadsheet
  const handleCreateSpreadsheet = async () => {
    setStatusError(null);
    setIsCreating(true);
    setCreatedResult(null);
    try {
      const token = await ensureToken();
      const res = await createComparisonSpreadsheet(token, entityA, entityB, {
        customTitle,
        includeHistorical: incTrajectory,
        includeSectors: incSectors,
        includeMilestones: incMilestones,
      });
      setCreatedResult({
        id: res.spreadsheetId,
        url: res.spreadsheetUrl,
        title: res.title,
      });
    } catch (err: any) {
      setStatusError(err.message || 'Failed to create spreadsheet.');
    } finally {
      setIsCreating(false);
    }
  };

  // 2. Append Comparison (Requires explicit user confirmation modal)
  const handleConfirmAppend = async () => {
    setShowAppendConfirmDialog(false);
    setStatusError(null);
    setAppendSuccessMessage(null);
    setIsAppending(true);
    try {
      const token = await ensureToken();
      if (!selectedSpreadsheetId || !selectedSheetTitle) {
        throw new Error('Please select a spreadsheet and sheet tab first.');
      }
      const res = await appendComparisonToSpreadsheet(
        token,
        selectedSpreadsheetId,
        selectedSheetTitle,
        entityA,
        entityB
      );
      setAppendSuccessMessage(
        `Successfully appended ${res.updatedRows} rows to tab "${selectedSheetTitle}".`
      );
    } catch (err: any) {
      setStatusError(err.message || 'Failed to append to spreadsheet.');
    } finally {
      setIsAppending(false);
    }
  };

  // 3. Preview Sheet
  const handleLoadPreview = async () => {
    if (!selectedSpreadsheetId || !selectedSheetTitle) return;
    setIsLoadingPreview(true);
    setStatusError(null);
    try {
      const token = await ensureToken();
      const rows = await readSpreadsheetValues(
        token,
        selectedSpreadsheetId,
        `${selectedSheetTitle}!A1:Z30`
      );
      setPreviewValues(rows);
    } catch (err: any) {
      setStatusError(err.message || 'Failed to read sheet values.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="google-sheets-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        id="google-sheets-modal"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-linear-to-r from-emerald-50/50 via-white to-slate-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Google Sheets Integration
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  v4 Sheets API
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Export macroeconomic benchmarks and historical data directly to Google Sheets
              </p>
            </div>
          </div>

          <button
            id="close-sheets-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account / Auth Status Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
          {user ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {user.displayName || user.email}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium ml-2">
                    ● Connected to Google Workspace
                  </span>
                </div>
              </div>

              <button
                id="sheets-logout-btn"
                onClick={handleSignOut}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Sign in with Google to create or sync spreadsheets</span>
              </div>

              {/* Official Google Sign-In Styled Button */}
              <button
                id="sheets-signin-btn"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs flex items-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Error Banner if any */}
        {(authError || statusError) && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">{authError || statusError}</div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="px-4 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs">
          <button
            id="sheets-tab-create"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 font-semibold flex items-center space-x-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'create'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Spreadsheet</span>
          </button>

          <button
            id="sheets-tab-append"
            onClick={() => setActiveTab('append')}
            className={`pb-2.5 font-semibold flex items-center space-x-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'append'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Append to Existing Sheet</span>
          </button>

          <button
            id="sheets-tab-preview"
            onClick={() => {
              setActiveTab('preview');
              if (selectedSpreadsheetId && selectedSheetTitle) {
                handleLoadPreview();
              }
            }}
            className={`pb-2.5 font-semibold flex items-center space-x-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'preview'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Sheet Inspector</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 text-xs space-y-4">
          {/* TAB 1: CREATE NEW SPREADSHEET */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Spreadsheet Title:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Economic Comparison - US vs China"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <span className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Worksheets to Generate in Workbook:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 flex items-start space-x-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">1. Macro Specs (Core)</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Nominal GDP, PPP, per capita, growth, debt, inflation, and HDI.
                      </p>
                    </div>
                  </div>

                  <label className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-start space-x-2.5 transition-colors">
                    <input
                      type="checkbox"
                      checked={incTrajectory}
                      onChange={(e) => setIncTrajectory(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">2. 10-Year Trajectory</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Year-by-year 2015-2024 GDP, per capita, and 2015=100 index.
                      </p>
                    </div>
                  </label>

                  <label className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-start space-x-2.5 transition-colors">
                    <input
                      type="checkbox"
                      checked={incSectors}
                      onChange={(e) => setIncSectors(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">3. Sector Composition</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Breakdown of services, manufacturing, agriculture, tech & finance.
                      </p>
                    </div>
                  </label>

                  <label className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-start space-x-2.5 transition-colors">
                    <input
                      type="checkbox"
                      checked={incMilestones}
                      onChange={(e) => setIncMilestones(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">4. Policy Milestones</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Chronological fiscal stimulus, tax acts, rate cycles, and shocks.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Success Result Banner */}
              {createdResult && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-xs">Spreadsheet Created Successfully!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    "{createdResult.title}" is ready in your Google Drive.
                  </p>
                  <div className="pt-1">
                    <a
                      href={createdResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
                    >
                      <span>Open in Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  id="create-google-sheet-submit-btn"
                  onClick={handleCreateSpreadsheet}
                  disabled={isCreating}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Spreadsheet in Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export to New Google Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: APPEND TO EXISTING SPREADSHEET */}
          {activeTab === 'append' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Target Google Spreadsheet:
                  </label>
                  {accessToken && (
                    <button
                      onClick={() => loadRecentSpreadsheets(accessToken)}
                      disabled={isLoadingRecent}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center space-x-1"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isLoadingRecent ? 'animate-spin' : ''}`}
                      />
                      <span>Refresh Recent</span>
                    </button>
                  )}
                </div>

                {recentFiles.length > 0 && (
                  <select
                    value={selectedSpreadsheetId}
                    onChange={(e) => {
                      setSelectedSpreadsheetId(e.target.value);
                      if (accessToken) fetchTabsForId(accessToken, e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden mb-2 bg-white dark:bg-slate-800 dark:text-slate-100"
                  >
                    {recentFiles.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.name}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={selectedSpreadsheetId}
                    onChange={(e) => setSelectedSpreadsheetId(e.target.value)}
                    placeholder="Or paste Google Spreadsheet ID / URL"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white dark:bg-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <button
                    onClick={() => {
                      if (accessToken) fetchTabsForId(accessToken, selectedSpreadsheetId);
                    }}
                    disabled={isLoadingMetadata || !selectedSpreadsheetId}
                    className="px-3 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isLoadingMetadata ? 'Loading...' : 'Fetch Tabs'}
                  </button>
                </div>
              </div>

              {/* Sheet Tab Picker */}
              {sheetMetadata && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Workbook: {sheetMetadata.title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {sheetMetadata.sheets.length} tab(s) found
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                       Choose Tab to Append To:
                    </label>
                    <select
                      value={selectedSheetTitle}
                      onChange={(e) => setSelectedSheetTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden"
                    >
                      {sheetMetadata.sheets.map((s) => (
                        <option key={s.sheetId} value={s.title}>
                          {s.title} {s.rowCount ? `(~${s.rowCount} rows)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Success Result */}
              {appendSuccessMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{appendSuccessMessage}</span>
                </div>
              )}

              {/* Append Trigger Button */}
              <div className="pt-2">
                <button
                  id="append-google-sheet-trigger-btn"
                  onClick={() => setShowAppendConfirmDialog(true)}
                  disabled={isAppending || !selectedSpreadsheetId || !selectedSheetTitle}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isAppending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Writing Rows to Spreadsheet...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Append Comparison Data to Tab</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SHEET INSPECTOR / PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Spreadsheet Data Inspector
                </span>
                <button
                  onClick={handleLoadPreview}
                  disabled={isLoadingPreview || !selectedSpreadsheetId}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                  <span>Reload Cells</span>
                </button>
              </div>

              {isLoadingPreview ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
                  Loading sheet cells...
                </div>
              ) : previewValues.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto max-h-[300px]">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-[11px]">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {previewValues.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx === 0 ? 'bg-slate-100 dark:bg-slate-800 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                        >
                          <td className="px-2 py-1 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-700 text-center select-none w-8">
                            {rIdx + 1}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="px-3 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 last:border-0"
                            >
                              {cell !== undefined && cell !== null ? String(cell) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  Select a spreadsheet and tab under the "Append" tab, then click "Reload Cells" to inspect rows.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Google Sheets v4 REST Protocol</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION DIALOG FOR DATA MUTATIONS */}
      {showAppendConfirmDialog && (
        <div
          id="confirm-append-dialog-backdrop"
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/80 p-4"
          onClick={() => setShowAppendConfirmDialog(false)}
        >
          <div
            id="confirm-append-dialog"
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Confirm Google Sheets Update
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Are you sure you want to write comparison records to spreadsheet{' '}
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    "{sheetMetadata?.title || selectedSpreadsheetId}"
                  </span>{' '}
                  under worksheet tab{' '}
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    "{selectedSheetTitle}"
                  </span>
                  ? This will append new macroeconomic data rows to your spreadsheet.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                id="cancel-append-confirm-btn"
                onClick={() => setShowAppendConfirmDialog(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                id="execute-append-confirm-btn"
                onClick={handleConfirmAppend}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                Confirm & Write Rows
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
