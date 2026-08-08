#define UNICODE
#define _UNICODE

#include <windows.h>
#include <commdlg.h>
#include <vector>
#include <string>
#include <fstream>
using namespace std;

wstring g_text;
int g_cursorPos = 0;
int g_windowWidth = 800;
int g_windowHeight = 600;
int g_charWidth = 10;
int g_charHeight = 20;
int g_textStartX = 30;
int g_textStartY = 50;
int g_lineSpacing = 2;
vector<int> g_lineStarts;
wstring g_currentFile = L"";
int g_cursorTargetCol = 0;
void UpdateLineStarts();
void GetCursorPixelPos(int& x, int& y);
void OnFileNew(HWND hWnd);
void OnFileOpen(HWND hWnd);
void OnFileSave(HWND hWnd);
void OnFileSaveAs(HWND hWnd);
void UpdateLineStarts()
{
	g_lineStarts.clear();
	g_lineStarts.push_back(0);
	
	for (int i = 0; i < (int)g_text.length(); i++)
	{
		if (g_text[i] == L'\n')
		{
			g_lineStarts.push_back(i + 1);
		}
	}
}
void GetCursorPixelPos(int&x,int&y)
{
	if (g_lineStarts.empty())
	{
		UpdateLineStarts();
	}
	int lineIndex = 0;
	int charInLine = 0;
	for (int i = 0; i < (int)g_lineStarts.size(); i++)
	{
		int start = g_lineStarts[i];
		int end = (i + 1 < (int)g_lineStarts.size()) ? g_lineStarts[i + 1] - 1 : (int)g_text.length();
		if (g_cursorPos >= start && g_cursorPos <= end)
		{
			lineIndex = i;
			charInLine = g_cursorPos - start;
			break;
		}
	}
	if (g_cursorPos > 0 && g_cursorPos < (int)g_text.length() && g_text[g_cursorPos - 1] == L'\n')
		if (lineIndex + 1 < (int)g_lineStarts.size())
			lineIndex++,
			charInLine = 0;
	x = g_textStartX + charInLine * g_charWidth;
	y = g_textStartY + lineIndex * (g_charHeight + g_lineSpacing);
}
void OnFileNew(HWND hWnd)
{
	if (!g_text.empty())
	{
		if (MessageBox(hWnd, L"当前文本未保存，是否继续？", L"新建", MB_YESNO) == IDNO)
			return;
	}
	g_text.clear();
	g_cursorPos = 0;
	g_currentFile = L"";
	g_cursorTargetCol = 0;
	UpdateLineStarts();
	InvalidateRect(hWnd, NULL, TRUE);
	SetWindowText(hWnd, L"GDI 文本编辑器 - 未命名");
}
void OnFileOpen(HWND hWnd)
{
	OPENFILENAME ofn = {0};
	wchar_t szFile[260] = {0};
	ofn.lStructSize = sizeof(ofn);
	ofn.hwndOwner = hWnd;
	ofn.lpstrFile = szFile;
	ofn.nMaxFile = sizeof(szFile) / sizeof(wchar_t);
	ofn.lpstrFilter = L"文本文件\0*.txt\0所有文件\0*.*\0";
	ofn.nFilterIndex = 1;
	ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST;
	if (GetOpenFileName(&ofn))
	{
		g_currentFile = szFile;
		int len = WideCharToMultiByte(CP_UTF8, 0, szFile, -1, NULL, 0, NULL, NULL);
		string fileName(len, '\0');
		WideCharToMultiByte(CP_UTF8, 0, szFile, -1, &fileName[0], len, NULL, NULL);
		fileName.pop_back();
		ifstream file(fileName, ios::binary);
		if (file)
		{
			string utf8Content((istreambuf_iterator<char>(file)),istreambuf_iterator<char>());
			file.close();
			int lenW = MultiByteToWideChar(CP_UTF8, 0, utf8Content.c_str(), -1, NULL, 0);
			wstring wide(lenW, L'\0');
			MultiByteToWideChar(CP_UTF8, 0, utf8Content.c_str(), -1, &wide[0], lenW);
			g_text = wide;
			g_cursorPos = (int)g_text.length();
			g_cursorTargetCol = 0;
			UpdateLineStarts();
			InvalidateRect(hWnd, NULL, TRUE);
			SetWindowText(hWnd, (wstring(L"GDI 文本编辑器 - ") + g_currentFile).c_str());
		}
		else
		{
			MessageBox(hWnd, L"无法打开文件！", L"错误", MB_OK);
		}
	}
}
void OnFileSaveAs(HWND hWnd)
{
	OPENFILENAME ofn = {0};
	wchar_t szFile[260] = {0};
	ofn.lStructSize = sizeof(ofn);
	ofn.hwndOwner = hWnd;
	ofn.lpstrFile = szFile;
	ofn.nMaxFile = sizeof(szFile) / sizeof(wchar_t);
	ofn.lpstrFilter = L"文本文件\0*.txt\0所有文件\0*.*\0";
	ofn.nFilterIndex = 1;
	ofn.Flags = OFN_PATHMUSTEXIST | OFN_OVERWRITEPROMPT;
	if (GetSaveFileName(&ofn))
	{
		g_currentFile = szFile;
		OnFileSave(hWnd);
	}
}
void OnFileSave(HWND hWnd)
{
	if (g_currentFile.empty())
	{
		OnFileSaveAs(hWnd);
		return;
	}
	int len = WideCharToMultiByte(CP_UTF8, 0, g_currentFile.c_str(), -1, NULL, 0, NULL, NULL);
	string fileName(len, '\0');
	WideCharToMultiByte(CP_UTF8, 0, g_currentFile.c_str(), -1, &fileName[0], len, NULL, NULL);
	fileName.pop_back();
	int lenU = WideCharToMultiByte(CP_UTF8, 0, g_text.c_str(), -1, NULL, 0, NULL, NULL);
	string utf8(lenU, '\0');
	WideCharToMultiByte(CP_UTF8, 0, g_text.c_str(), -1, &utf8[0], lenU, NULL, NULL);
	ofstream file(fileName, ios::binary);
	if (file)
	{
		file.write(utf8.c_str(), utf8.length() - 1);
		file.close();
		SetWindowText(hWnd, (wstring(L"GDI 文本编辑器 - ") + g_currentFile).c_str());
	}
	else
		MessageBox(hWnd, L"保存文件失败！", L"错误", MB_OK);
	return;
}
LRESULT CALLBACK WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
	switch (msg)
	{
	case WM_CREATE:
	{
		HMENU hMenu = CreateMenu();
		HMENU hFileMenu = CreatePopupMenu();
		AppendMenu(hFileMenu, MF_STRING, 1001, L"新建(&N)\tCtrl+N");
		AppendMenu(hFileMenu, MF_STRING, 1002, L"打开(&O)\tCtrl+O");
		AppendMenu(hFileMenu, MF_STRING, 1003, L"保存(&S)\tCtrl+S");
		AppendMenu(hFileMenu, MF_STRING, 1004, L"另存为(&A)");
		AppendMenu(hFileMenu, MF_SEPARATOR, 0, NULL);
		AppendMenu(hFileMenu, MF_STRING, 1005, L"退出(&X)");
		AppendMenu(hMenu, MF_POPUP, (UINT_PTR)hFileMenu, L"文件(&F)");
		SetMenu(hWnd, hMenu);
		UpdateLineStarts();
		CreateCaret(hWnd, NULL, 2, g_charHeight);
		ShowCaret(hWnd);
		SetWindowText(hWnd, L"GDI 文本编辑器 - 未命名");
		return 0;
	}
	case WM_SIZE:
		{
			g_windowWidth = LOWORD(lParam);
			g_windowHeight = HIWORD(lParam);
			return 0;
		}
	case WM_COMMAND:
		{
			switch (LOWORD(wParam))
			{
				case 1001: OnFileNew(hWnd); break;
				case 1002: OnFileOpen(hWnd); break;
				case 1003: OnFileSave(hWnd); break;
				case 1004: OnFileSaveAs(hWnd); break;
				case 1005: PostQuitMessage(0); break;
			}
			return 0;
		}
	case WM_CHAR:
		{
			wchar_t ch = (wchar_t)wParam;
			
			if (ch == 9)
			{
				g_text.insert(g_cursorPos, 4, L' ');
				g_cursorPos += 4;
			}
			else if (ch == 8)
			{
				if (g_cursorPos > 0)
				{
					if (g_cursorPos >= 4 && g_text.substr(g_cursorPos - 4, 4) == L"    ")
					{
						g_text.erase(g_cursorPos - 4, 4);
						g_cursorPos -= 4;
					}
					else
					{
						g_text.erase(g_cursorPos - 1, 1);
						g_cursorPos--;
					}
				}
			}
			else if (ch == 13)
			{
				g_text.insert(g_cursorPos, 1, L'\n');
				g_cursorPos++;
			}
			else if (ch >= 32)
			{
				g_text.insert(g_cursorPos, 1, ch);
				g_cursorPos++;
			}
			
			UpdateLineStarts();
			g_cursorTargetCol = 0;
			
			int x, y;
			GetCursorPixelPos(x, y);
			SetCaretPos(x, y);
			
			InvalidateRect(hWnd, NULL, TRUE);
			return 0;
		}
	case WM_KEYDOWN:
		{
			bool needUpdate = false;
			
			switch (wParam)
			{
			case VK_LEFT:
				if (g_cursorPos > 0)
				{
					g_cursorPos--;
					needUpdate = true;
					g_cursorTargetCol = 0;
				}
				break;
				
			case VK_RIGHT:
				if (g_cursorPos < (int)g_text.length())
				{
					g_cursorPos++;
					needUpdate = true;
					g_cursorTargetCol = 0;
				}
				break;
				
			case VK_UP:
				{
					int lineIndex = 0;
					int charInLine = 0;
					for (int i = 0; i < (int)g_lineStarts.size(); i++)
					{
						int start = g_lineStarts[i];
						int end = (i + 1 < (int)g_lineStarts.size()) ? g_lineStarts[i + 1] - 1 : (int)g_text.length();
						if (g_cursorPos >= start && g_cursorPos <= end)
						{
							lineIndex = i;
							charInLine = g_cursorPos - start;
							break;
						}
					}
					
					if (g_cursorTargetCol == 0)
						g_cursorTargetCol = charInLine;
					
					if (lineIndex > 0)
					{
						int newStart = g_lineStarts[lineIndex - 1];
						int newEnd = g_lineStarts[lineIndex] - 1;
						int newPos = newStart + g_cursorTargetCol;
						if (newPos > newEnd) newPos = newEnd;
						if (newPos < newStart) newPos = newStart;
						g_cursorPos = newPos;
						needUpdate = true;
					}
					break;
				}
				
			case VK_DOWN:
				{
					int lineIndex = 0;
					int charInLine = 0;
					for (int i = 0; i < (int)g_lineStarts.size(); i++)
					{
						int start = g_lineStarts[i];
						int end = (i + 1 < (int)g_lineStarts.size()) ? g_lineStarts[i + 1] - 1 : (int)g_text.length();
						if (g_cursorPos >= start && g_cursorPos <= end)
						{
							lineIndex = i;
							charInLine = g_cursorPos - start;
							break;
						}
					}
					
					if (g_cursorTargetCol == 0)
						g_cursorTargetCol = charInLine;
					
					if (lineIndex + 1 < (int)g_lineStarts.size())
					{
						int newStart = g_lineStarts[lineIndex + 1];
						int newEnd = (lineIndex + 2 < (int)g_lineStarts.size()) ? g_lineStarts[lineIndex + 2] - 1 : (int)g_text.length();
						int newPos = newStart + g_cursorTargetCol;
						if (newPos > newEnd) newPos = newEnd;
						if (newPos < newStart) newPos = newStart;
						g_cursorPos = newPos;
						needUpdate = true;
					}
					break;
				}
				
			case VK_HOME:
				{
					for (int i = 0; i < (int)g_lineStarts.size(); i++)
					{
						if (g_cursorPos >= g_lineStarts[i])
						{
							g_cursorPos = g_lineStarts[i];
							needUpdate = true;
							g_cursorTargetCol = 0;
							break;
						}
					}
					break;
				}
				
			case VK_END:
				{
					for (int i = 0; i < (int)g_lineStarts.size(); i++)
					{
						int start = g_lineStarts[i];
						int end = (i + 1 < (int)g_lineStarts.size()) ? g_lineStarts[i + 1] - 1 : (int)g_text.length();
						if (g_cursorPos >= start && g_cursorPos <= end)
						{
							g_cursorPos = end;
							if (g_cursorPos < (int)g_text.length() && g_text[g_cursorPos] == L'\n')
								g_cursorPos--;
							needUpdate = true;
							g_cursorTargetCol = 0;
							break;
						}
					}
					break;
				}
			}
			
			if (needUpdate)
			{
				int x, y;
				GetCursorPixelPos(x, y);
				SetCaretPos(x, y);
				InvalidateRect(hWnd, NULL, TRUE);
			}
			return 0;
		}
	case WM_PAINT:
		{
			PAINTSTRUCT ps;
			HDC hdc = BeginPaint(hWnd, &ps);
			SetBkMode(hdc, TRANSPARENT);
			HFONT hFont = CreateFontW(g_charHeight,
									  0, 0, 0,
									  FW_NORMAL,
									  FALSE, FALSE, FALSE,
									  DEFAULT_CHARSET,
									  OUT_DEFAULT_PRECIS,
									  CLIP_DEFAULT_PRECIS,
									  DEFAULT_QUALITY,
									  DEFAULT_PITCH | FF_DONTCARE,
									  L"Consolas");
			HFONT hOldFont = (HFONT)SelectObject(hdc, hFont);
			SetTextColor(hdc, RGB(0, 0, 0));
			RECT rect = {g_textStartX, g_textStartY, g_windowWidth - 10, g_windowHeight - 10};
			DrawTextW(hdc, g_text.c_str(), (int)g_text.length(), &rect, DT_LEFT | DT_TOP | DT_WORDBREAK);
			SetTextColor(hdc, RGB(128, 128, 128));
			int lineCount = (int)g_lineStarts.size();
			int lineNumWidth = 0;
			if (lineCount > 0)
			{
				wchar_t numStr[20];
				swprintf(numStr, 20, L"%d", lineCount);
				int numLen = (int)wcslen(numStr);
				SIZE size;
				GetTextExtentPoint32(hdc, numStr, numLen, &size);
				lineNumWidth = size.cx + 6;
				g_textStartX = lineNumWidth + 6;
			}
			for (int i = 0; i < lineCount; i++)
			{
				wchar_t lineNum[20];
				swprintf(lineNum, 20, L"%d", i + 1);
				RECT numRect = {4, g_textStartY + i * (g_charHeight + g_lineSpacing), 
					g_textStartX - 4, 0};
				DrawTextW(hdc, lineNum, -1, &numRect, DT_LEFT | DT_TOP | DT_NOCLIP);
			}
			SelectObject(hdc, hOldFont);
			DeleteObject(hFont);
			EndPaint(hWnd, &ps);
			return 0;
		}
	case WM_SETFOCUS:
		{
			CreateCaret(hWnd, NULL, 2, g_charHeight);
			ShowCaret(hWnd);
			int x, y;
			GetCursorPixelPos(x, y);
			SetCaretPos(x, y);
			return 0;
		}
	case WM_KILLFOCUS:
		{
			HideCaret(hWnd);
			DestroyCaret();
			return 0;
		}
	case WM_DESTROY:
		{
			PostQuitMessage(0);
			return 0;
		}
	}
	return DefWindowProc(hWnd, msg, wParam, lParam);
}
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow)
{
	WNDCLASS wc = {0};
	wc.lpfnWndProc = WndProc;
	wc.hInstance = hInstance;
	wc.hCursor = LoadCursor(NULL, IDC_ARROW);
	wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
	wc.lpszClassName = L"TextEditorClass";
	if (!RegisterClass(&wc))
	{
		MessageBox(NULL, L"窗口类注册失败！", L"错误", MB_OK);
		return 0;
	}
	HWND hWnd = CreateWindowW(L"TextEditorClass",
							  L"Mio-IDE",
							  WS_OVERLAPPEDWINDOW,
							  CW_USEDEFAULT, CW_USEDEFAULT,
							  g_windowWidth, g_windowHeight,
							  NULL, NULL, hInstance, NULL);
	if(!hWnd)
	{
		MessageBox(NULL, L"窗口创建失败！", L"错误", MB_OK);
		return 0;
	}
	ShowWindow(hWnd, nCmdShow);
	UpdateWindow(hWnd);
	MSG msg;
	while (GetMessage(&msg, NULL, 0, 0))
	{
		TranslateMessage(&msg);
		DispatchMessage(&msg);
	}
	return msg.wParam;
}
