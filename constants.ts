import { Stage } from './types';

export const INTERVIEW_STAGES: Stage[] = [
  {
    id: 'stage1',
    title: '1단계: 인성 및 가치관',
    sections: [
      {
        id: 's1_a',
        title: 'A. 개인 캐릭터 / 성격 구조 질문',
        questions: [
          { id: 'q1_1', text: '본인이 스스로 생각하는 성격 3 가지 키워드는?', checkpoints: ['자기인식 수준'] },
          { id: 'q1_2', text: '친한 친구가 본인을 한 문장으로 정의한다면?', checkpoints: ['자기인식 수준'] },
          { id: 'q1_3', text: '스트레스 받으면 나타나는 본인만의 반응 패턴은?', checkpoints: ['감정조절 능력'] },
          { id: 'q1_4', text: '화가 났을 때, 그 감정을 어떻게 처리하는 편인가요?', checkpoints: ['감정조절 능력'] },
          { id: 'q1_5', text: '살면서 가장 따뜻했던/차가웠던 순간은?', checkpoints: ['자기성찰', '방어적 태도 여부'] },
          { id: 'q1_6', text: '에너지가 완전히 고갈(Burn-out)되었다고 느낄 때, 몸이나 마음이 보내는 신호가 있나요?', checkpoints: ['자기인식', '감정조절'] },
          { id: 'q1_7', text: "삶에서 예기치 못한 '브레이크'가 걸렸던 적이 있나요? 그때 어떻게 다시 일상으로 돌아오셨나요?", checkpoints: ['자기성찰', '문제대처'] },
        ]
      },
      {
        id: 's1_b',
        title: 'B. 성장배경 / 가정환경',
        questions: [
          { id: 'q1_8', text: '자라온 환경이나 성장 배경 중에서 ‘아, 이게 나한테 영향을 줬구나’ 싶은 게 있나요?', checkpoints: ['책임감 구조'] },
          { id: 'q1_9', text: '가정이나 성장 과정에서 자연스럽게 배우게 된 가치관이나 생활 습관 중, 지금의 본인에게 도움이 되고 있다고 느끼는 게 있다면 나눠주실 수 있을까요?', checkpoints: ['관계 맺는 방식'] },
          { id: 'q1_10', text: '힘들거나 고민이 있을 때, 보통 어떤 사람이나 어떤 방식에 가장 먼저 의지하는 편이신가요?', checkpoints: ['의존형/독립형 성향'] },
        ]
      },
      {
        id: 's1_c',
        title: 'C. 삶의 태도 / 내적 기준',
        questions: [
          { id: 'q1_11', text: '삶을 살아가면서 자신만의 기준이 되는 말이나 좌우명이 있을까요?', checkpoints: ['성장 마인드셋'] },
          { id: 'q1_12', text: '지금까지 인생에서 가장 힘들었던 순간은 언제이며 그 상황을 어떻게 넘겼나요?', checkpoints: ['문제대처 방식', '회피형 vs 직면형'] },
          { id: 'q1_13', text: '혹시 살아오면서 본인을 성장시켰다고 느낀 사건이나 경험이 있다면 공유해주실 수 있을까요?', checkpoints: ['피해자 프레임 여부'] },
        ]
      }
    ]
  },
  {
    id: 'stage2',
    title: '2단계: 조직 적응력 및 문화',
    sections: [
      {
        id: 's2_a',
        title: 'A. 팀워크 구조',
        questions: [
          { id: 'q2_1', text: '팀에서 일을 할 때, 본인이 주로 맡는 역할이나 포지션이 있다면 어떻게 생각하시나요?', checkpoints: ['리더형/서포터형/조율자형/실행자형'] },
          { id: 'q2_2', text: '팀에서 의견 충돌이나 갈등이 생기면 보통 본인은 어떻게 대응하시는 편인가요?', checkpoints: ['소통 방식', '권위 인식'] },
          { id: 'q2_3', text: '의견 충돌 시 본인 주장 표현하기 위해 어떻게 하나요?', checkpoints: ['소통 방식'] },
          { id: 'q2_4', text: '상사와 생각이 다를 때, 본인만의 표현 방식이 있나요?', checkpoints: ['수직적 관계 인식'] },
          { id: 'q2_5', text: '완벽하게 준비되지 않은 상태에서 일을 시작한다면, 어떤 기분이 드나요?', checkpoints: ['수용성'] },
          { id: 'q2_6', text: '혼자 vs 팀, 어떤 환경 선호나요?', checkpoints: ['조직 적응력'] },
          { id: 'q2_7', text: '본인이 리더라고 가정했을 때, 다루기 힘든 팀원 유형은 어떤 유형이라고 생각하나요?', checkpoints: ['조직 적응력'] },
        ]
      },
      {
        id: 's2_b',
        title: 'B. 조직 문화 적응력 질문',
        questions: [
          { id: 'q2_8', text: '이전 경험 중에서 가장 적응하기 어려웠던 조직 문화와, 반대로 가장 잘 맞았다고 느낀 조직 문화가 있다면 간단히 나눠주실 수 있을까요?', checkpoints: ['규칙 수용력', '시스템 적응력', '문화 적합성'] },
          { id: 'q2_9', text: '규칙이 많은 조직 vs 자유로운 조직 중 어느 쪽이 맞나요?', checkpoints: ['사고방식 유형'] },
        ]
      }
    ]
  },
  {
    id: 'stage3',
    title: '3단계: 직무 역량 (Skill)',
    sections: [
      {
        id: 's3_a',
        title: '기술 레벨',
        questions: [
          { id: 'q3_1', text: '피크타임 기준, 롤 몇 줄 정도 커버 가능하나요?', checkpoints: ['속도'] },
          { id: 'q3_2', text: 'Rush 상황에서 실수 줄이는 본인만의 방식이 있나요?', checkpoints: ['속도 & 정확성'] },
          { id: 'q3_3', text: '사시미 작업 시 가장 중요하게 보는 포인트는?', checkpoints: ['디테일 인식'] },
          { id: 'q3_4', text: '위생 기준 중 가장 중요하다고 생각하는 건?', checkpoints: ['디테일 인식'] },
          { id: 'q3_5', text: 'Salmon Sashimi 직접 잡아본 경험이 있나요?', checkpoints: ['기술/경험 깊이'] },
          { id: 'q3_6', text: '필렛/슬라이스/ 포션 작업 경험을 구분해서 말할 수 있나요?', checkpoints: ['기술/경험 깊이'] },
          { id: 'q3_7', text: '주문 밀릴 때 우선순위 정하는 기준은?', checkpoints: ['멀티태스킹'] },
          { id: 'q3_8', text: '동시에 몇개 스테이션까지 커버 가능한지?', checkpoints: ['멀티태스킹'] },
        ]
      }
    ]
  },
  {
    id: 'stage4',
    title: '4단계: 경력 및 이력',
    sections: [
      {
        id: 's4_a',
        title: '경력 사항',
        questions: [
          { id: 'q4_1', text: '이전 경력 중 가장 오랫동안 근무하신 회사나 역할이 있으신가요? 그 경험에서 맡으셨던 주요 업무나 책임은 어떤 것이었을까요?', checkpoints: ['이직 패턴'] },
          { id: 'q4_2', text: '그 직장을 떠나신 이유를 간단히 말씀해주실 수 있을까요? 그만두면서 깨달은게 있으신가요?', checkpoints: ['반복 사유 여부'] },
          { id: 'q4_3', text: '상사나 동료들과의 관계는 어땠나요?', checkpoints: ['관계 유지 능력'] },
        ]
      }
    ]
  },
  {
    id: 'stage5',
    title: '5단계: 비전 및 목표',
    sections: [
      {
        id: 's5_a',
        title: '비전 및 목표',
        questions: [
          { id: 'q5_1', text: '1 년 뒤 본인의 근무 모습을 상상해 보면?', checkpoints: ['성장 의지', '커리어 목표'] },
          { id: 'q5_2', text: '3 년 뒤 삶의 모습은?', checkpoints: ['모티베이션 유형', '체류 가능성'] },
          { id: 'q5_3', text: '이 일을 통해 얻고 싶은 것은?', checkpoints: ['성장 의지', '커리어 목표'] },
          { id: 'q5_4', text: '이 일이 커리어에 어떤 의미인가요?', checkpoints: ['조직 장기 적합성', '커리어 목표'] },
        ]
      }
    ]
  }
];