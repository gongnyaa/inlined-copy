import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as extension from '../../extension';
import { InlinedCopyService } from '../../services/InlinedCopyService';
import { VSCodeWrapper } from '../../utils/VSCodeWrapper';

vi.mock('../../services/InlinedCopyService', () => {
  return {
    InlinedCopyService: {
      Instance: vi.fn().mockReturnValue({
        executeCommand: vi.fn(),
      }),
    },
  };
});

vi.mock('../../utils/VSCodeWrapper', () => {
  return {
    VSCodeWrapper: {
      Instance: vi.fn().mockReturnValue({
        dispose: vi.fn(),
      }),
    },
  };
});

describe('Extension', () => {
  let mockContext: any;
  let mockDisposable: any;
  let vscode: any;
  let inlinedCopyServiceMock: any;
  let vsCodeWrapperMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockContext = {
      subscriptions: [],
    };

    mockDisposable = { dispose: vi.fn() };

    vscode = await import('vscode');
    vscode.commands.registerCommand.mockReturnValue(mockDisposable);

    inlinedCopyServiceMock = InlinedCopyService;
    vsCodeWrapperMock = VSCodeWrapper;
  });

  describe('activate関数', () => {
    it('inlined-copy.copyInlineコマンドを登録すること', () => {
      extension.activate(mockContext);

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'inlined-copy.copyInline',
        expect.any(Function)
      );
      expect(mockContext.subscriptions).toContain(mockDisposable);
    });

    it('コマンド実行時にInlinedCopyService.Instance().executeCommandが呼ばれること', () => {
      extension.activate(mockContext);

      const commandCallback = vscode.commands.registerCommand.mock.calls[0][1];
      commandCallback();

      expect(inlinedCopyServiceMock.Instance).toHaveBeenCalled();
      expect(inlinedCopyServiceMock.Instance().executeCommand).toHaveBeenCalled();
    });
  });

  describe('deactivate関数', () => {
    it('VSCodeWrapper.Instance().disposeが呼ばれること', () => {
      extension.deactivate();

      expect(vsCodeWrapperMock.Instance).toHaveBeenCalled();
      expect(vsCodeWrapperMock.Instance().dispose).toHaveBeenCalled();
    });
  });
});
