import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptInput } from './PromptInput';

describe('PromptInput', () => {
  it('프롬프트가 비어 있으면 생성 버튼이 비활성이다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
  });

  it('입력하면 버튼이 활성화되고 클릭 시 입력값으로 onGenerate가 호출된다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

    await user.type(screen.getByRole('textbox'), '프로필 카드');
    const submit = screen.getByRole('button', { name: '컴포넌트 생성' });
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onGenerate).toHaveBeenCalledWith('프로필 카드');
  });

  it('로딩 중에는 생성 버튼이 비활성이고 "생성 중..." 을 보여준다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: '생성 중...' })).toBeDisabled();
  });

  describe('promptHistory', () => {
    it('히스토리가 없으면 최근 프롬프트 섹션을 표시하지 않는다', () => {
      render(<PromptInput onGenerate={vi.fn()} isLoading={false} promptHistory={[]} />);
      expect(screen.queryByText('최근 프롬프트')).not.toBeInTheDocument();
    });

    it('히스토리가 있으면 최근 프롬프트 섹션을 표시한다', () => {
      render(
        <PromptInput
          onGenerate={vi.fn()}
          isLoading={false}
          promptHistory={['버튼 컴포넌트', '카드 레이아웃']}
        />,
      );
      expect(screen.getByText('최근 프롬프트')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '버튼 컴포넌트' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '카드 레이아웃' })).toBeInTheDocument();
    });

    it('히스토리 칩을 클릭하면 textarea에 해당 프롬프트가 채워진다', async () => {
      const user = userEvent.setup();
      render(
        <PromptInput
          onGenerate={vi.fn()}
          isLoading={false}
          promptHistory={['버튼 컴포넌트']}
        />,
      );

      await user.click(screen.getByRole('button', { name: '버튼 컴포넌트' }));
      expect(screen.getByRole('textbox')).toHaveValue('버튼 컴포넌트');
    });

    it('히스토리가 5개를 넘어도 최대 5개만 표시된다', () => {
      const history = ['A', 'B', 'C', 'D', 'E', 'F'];
      render(<PromptInput onGenerate={vi.fn()} isLoading={false} promptHistory={history} />);
      // 최근 프롬프트 칩 6개 중 5개만 렌더링
      expect(screen.queryByRole('button', { name: 'F' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'E' })).toBeInTheDocument();
    });
  });
});
