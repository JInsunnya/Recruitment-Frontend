import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as W from "../styles/writeStyles";
import Dropdown from '../../assets/images/dropdown_icon.png';

const Write = () => {
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem('submittedFormData');
        const parsedData = savedData ? JSON.parse(savedData) : {};
        return {
            track: parsedData.track || "",
            answer1: parsedData.answer1 || "",
            answer2: parsedData.answer2 || "",
            answer3: parsedData.answer3 || "",
            answer4: parsedData.answer4 || "",
            answer5: parsedData.answer5 || "",
            canSpendTime: parsedData.canSpendTime === true || parsedData.canSpendTime === "true" || parsedData.canSpendTime === "true" ? true : false,
            portfolio: parsedData.portfolio || ""
        };
    });

    const [isEditMode, setIsEditMode] = useState(false);  
    const [applicationId, setApplicationId] = useState(null); 
    const accessToken = localStorage.getItem('access_token');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const textareasRef = useRef([]); 

    const autoResize = () => {
        textareasRef.current.forEach((textarea) => {
            if (textarea) {
                textarea.style.height = "auto";
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        });
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
    const trackOptions = [
        { value: 0, label: "프론트엔드" },
        { value: 1, label: "백엔드" },
        { value: 2, label: "기획/디자인" }
    ];

    useLayoutEffect(() => {
        const savedFormData = localStorage.getItem('submittedFormData');
        const savedApplicationId = localStorage.getItem('applicationId');
        const savedData = localStorage.getItem('submittedFormData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.canSpendTime === true || parsedData.canSpendTime === "true") {
                setFormData(prev => ({ ...prev, canSpendTime: "True" }));
            }
        }

        if (savedApplicationId) {
            setIsSubmitted(true);
        }

        autoResize(); 
    }, []);


    useEffect(() => {
        const handleStorageChange = () => {
            const savedFormData = localStorage.getItem('submittedFormData');
            const savedApplicationId = localStorage.getItem('applicationId');
            
            if (savedFormData) {
                const parsedData = JSON.parse(savedFormData);
                setFormData(parsedData); 
            }
    
            if (savedApplicationId) {
                setIsSubmitted(true);
                setApplicationId(savedApplicationId); 
            } else {
                setIsSubmitted(false);
                setApplicationId(null); 
            }
    
            setIsSubmitted(!!savedApplicationId);
    
            setTimeout(() => {
                textareasRef.current.forEach((textarea) => {
                    if (textarea) {
                        textarea.style.height = "auto";
                        textarea.style.height = `${textarea.scrollHeight}px`;
                    }
                });
            }, 0);
        };
    
        handleStorageChange();
    
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('formSubmitted', handleStorageChange);
    
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('formSubmitted', handleStorageChange);
        };
    }, []);
    

    const handleChange = (e, index) => {
        const { name, value, type } = e.target;
        const newFormData = {
            ...formData,
            [name]: type === "radio" ? value === "True" : value
        };
        setFormData(newFormData);
        localStorage.setItem('submittedFormData', JSON.stringify(newFormData));
        
        autoResize();
    };

    const handleTrackChange = (value) => {
        const newFormData = { ...formData, track: value, answer5: "" };
        setFormData(newFormData);
        localStorage.setItem('submittedFormData', JSON.stringify(newFormData));
        setIsDropdownOpen(false); 
    };

    const handleTrackDependentInput = (e, allowedTracks) => {
        if (!allowedTracks.includes(formData.track)) {
            e.target.blur();  
            alert("지원하실 트랙을 먼저 선택해 주세요."); 
        }
    };

    const TextboxHeight = (e) => {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
    }

    const handleSubmit = async () => {
        const accessToken = localStorage.getItem('access_token');
    
        if (!accessToken) {
            alert("로그인이 필요합니다.");
            return;
        }

        if (formData.track !== 0 && formData.track !== 1 && formData.track !== 2) {
            alert("지원하실 트랙을 선택해 주세요.");
            return;
        }
    
        if (formData.canSpendTime !== true && formData.canSpendTime !== "True") {
            alert("'예'를 선택해야 지원서를 제출할 수 있습니다.");
            return;
        }
    
        try {
            const response = await axios.post(
                "https://woodzverse.pythonanywhere.com/appliance/apply/",
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
    
            if (response.status === 201) {
                alert("제출이 완료되었습니다!");
                const newAppId = response.data.id;
                setApplicationId(newAppId);  
                setIsSubmitted(true);
                
                localStorage.setItem('submittedFormData', JSON.stringify(formData));
                localStorage.setItem('applicationId', newAppId);
                window.dispatchEvent(new Event('applicationSubmitted'));
            }
        } catch (error) {

            if (error.response) {
                if (error.response.status === 403 && error.response.data.error === "제출 기한이 지났습니다.") {
                    alert("제출 기한이 지났습니다. 지원서를 제출할 수 없습니다.");
                } else if (error.response.status === 400 && error.response.data.error === "이미 신청서를 작성하셨습니다.") {
                    alert("이미 신청서를 작성하셨습니다.");
                } else if (error.response.status === 401) {
                    alert("인증 오류: 다시 로그인해주세요.");
                } else {
                    alert("제출에 실패했습니다. 다시 시도해주세요.");
                }
            } else {
                alert("서버와의 연결에 문제가 발생했습니다.");
            }
        }
    };
    
    const handleEdit = async () => {
        if (!isSubmitted) {
            alert("지원서를 먼저 제출해주세요.");
            return;
        }

        if (!accessToken || !applicationId) {
            alert("수정할 지원서가 없습니다.");
            return;
        }

        try {
            const response = await axios.put(
                "https://woodzverse.pythonanywhere.com/appliance/edit/",
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                alert("수정이 완료되었습니다!");
                localStorage.setItem('submittedFormData', JSON.stringify(formData));
            }
        } catch (error) {
            alert("수정에 실패했습니다. 다시 시도해주세요.");
        }
    };

    useEffect(() => {
        if (accessToken) {
            axios.get("https://woodzverse.pythonanywhere.com/appliance/edit/", {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            }).then(response => {
                if (response.status === 200) {
                    setFormData(response.data);
                    setApplicationId(response.data.id);
                    setIsSubmitted(true);
                    localStorage.setItem('submittedFormData', JSON.stringify(response.data));
                    localStorage.setItem('applicationId', response.data.id);
                }
            }).catch(error => {
                //console.error("지원서 불러오기 실패:", error);
            });
        }
    }, [accessToken]);

    return (
    <W.Container>
        <W.Title>
            <W.TitleContent>지원서 작성</W.TitleContent>
        </W.Title>
        <W.Content>
            <W.Section>
                <W.SectionTitle>0. 지원하실 트랙을 선택해주세요.</W.SectionTitle>
                <W.DropdownContainer> 
                        <W.DropdownHeader onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            {formData.track !== "" ? trackOptions.find(option => option.value === formData.track).label : "트랙을 선택해주세요"}
                            <W.DropdownIcon src={Dropdown} alt="Dropdown" />
                        </W.DropdownHeader>
                        {isDropdownOpen && ( 
                            <W.DropdownList>
                                {trackOptions.map((option) => (
                                    <W.DropdownItem key={option.value} onClick={() => handleTrackChange(option.value)}> 
                                        {option.label}
                                    </W.DropdownItem>
                                ))}
                            </W.DropdownList>
                        )}
                    </W.DropdownContainer>
            </W.Section>
            {[
            { name: "answer1", title: "1. 멋쟁이사자처럼 대학에 지원하시게 된 이유를 작성해 주세요. (500자 이내)" },
            { name: "answer2", title: "2. 지원하신 파트를 선택한 이유와 관련 경험을 해본 적이 있는지, 그리고 이 파트를 통해 어떠한 성장을 희망하는지 작성해 주세요. (500자 이내)" },
            { name: "answer3", title: "3. 멋쟁이사자처럼 대학은 협업과 팀워크를 중요한 가치로 생각하는 공동체입니다. 지원자 본인이 협업 또는 팀워크를 진행해 보았던 경험을 자신이 맡았던 역할 및 협업의 성과를 위주로 작성해 주세요. (500자 이내)" },
            { name: "answer4", title: "4. (선택사항) 3번에서 작성한 경험을 멋쟁이사저처럼 대학에서 어떻게 적용할 수 있을지 작성해 주세요. (300자 이내)" }
            ].map((field, index) => (
            <W.Section key={index}>
                <W.SectionTitle>{field.title}</W.SectionTitle>
                <W.SectionContent>
                <W.Textarea
                    name={field.name}
                    maxLength={field.name === "answer4" ? "300" : "500"}
                    onInput={TextboxHeight}
                    onChange={(e) => handleChange(e, index)}
                    value={formData[field.name]}
                    ref={(el) => (textareasRef.current[index] = el)}
                    placeholder="내용을 입력하세요."
                />
                </W.SectionContent>
            </W.Section>
            ))}

            {((formData.track === 0 || formData.track === 1) || formData.track === "") && (
            <W.Section>
                <W.SectionTitle>5. 프론트엔드/백엔드 트랙 질문 <br/> 좋은 개발자는 무엇이라고 생각하시나요? 그리고 그러한 개발자가 되기 위해 지원자님께서 현재 혹은 미래에 어떠한 노력을 기울이고 싶으신지 작성해 주세요. (500자 이내)</W.SectionTitle>
                <W.SectionContent>
                <W.Textarea
                    name="answer5"
                    maxLength="500"
                    onInput={TextboxHeight}
                    onChange={(e) => handleChange(e, 4)}
                    value={formData.answer5}
                    onFocus={(e) => handleTrackDependentInput(e, [0, 1])}
                    placeholder="트랙 선택 후 입력하세요."
                    ref={(el) => (textareasRef.current[4] = el)}
                />
                </W.SectionContent>
            </W.Section>
            )}

            {(formData.track === 2 || formData.track === "") && (
            <W.Section>
                <W.SectionTitle>5. 기획/디자인 트랙 질문 <br/> 자신이 손수 기획하여 만들어보고 싶은 서비스에 대해 간단하게 설명해 주세요. (500자 이내)</W.SectionTitle>
                <W.SectionContent>
                <W.Textarea
                    name="answer5"
                    maxLength="500"
                    onInput={TextboxHeight}
                    onChange={(e) => handleChange(e, 4)}
                    value={formData.answer5}
                    onFocus={(e) => handleTrackDependentInput(e, [2])}
                    placeholder="트랙 선택 후 입력하세요."
                    ref={(el) => (textareasRef.current[4] = el)}
                />
                </W.SectionContent>
            </W.Section>
            )}

            <W.ChoiceContainer>
            <W.ChoiceTitle>6. 멋쟁이사자처럼 대학은 주 1회 정규 세션 뿐 아니라 과제나 팀 프로젝트 및 각종 해커톤으로 인해 상당히 많은 시간을 필요로 할 수 있습니다. 지원자님의 앞으로의 계획과 일정을 신중히 고려하신 뒤, 1년 동안 열심히 참여하실 수 있는 경우에 지원해 주세요.</W.ChoiceTitle>
            <W.Choice>
                <W.ChoiceInput
                type="radio"
                name="canSpendTime"
                value="True"
                checked={formData.canSpendTime === true || formData.canSpendTime === "True"}
                onChange={handleChange}
                />
                예
            </W.Choice>
            <W.Choice>
                <W.ChoiceInput
                type="radio"
                name="canSpendTime"
                value="False"
                checked={formData.canSpendTime === "False"}
                onChange={handleChange}
                disabled={isSubmitted}
                />
                아니오
            </W.Choice>
            </W.ChoiceContainer>

            <W.Section>
            <W.SectionTitle>7. 제출하고 싶은 깃허브 주소, 블로그, 포트폴리오가 있으신 경우에 작성해 주세요.</W.SectionTitle>
            <W.SectionContent>
                <W.Textarea
                name="portfolio"
                maxLength="500"
                onInput={TextboxHeight}
                onChange={(e) => handleChange(e, 5)}
                value={formData.portfolio}
                ref={(el) => (textareasRef.current[5] = el)}
                placeholder="내용을 입력하세요."
                />
            </W.SectionContent>
            </W.Section>

            <W.ButtonContainer>
            <W.ReButton 
                onClick={() => {
                    if (!isSubmitted) {
                        alert("지원서를 먼저 제출해주세요.");
                    } else {
                        handleEdit();
                    }
                }}
            >
                수정
            </W.ReButton>
            {!isSubmitted && (
                <W.SubmitButton
                onClick={handleSubmit}
                disabled={formData.canSpendTime === "False"}
                style={{
                    backgroundColor: formData.canSpendTime === "False" ? "#ccc" : "",
                    cursor: formData.canSpendTime === "False" ? "not-allowed" : "pointer",
                }}
                >
                제출
                </W.SubmitButton>
            )}
            </W.ButtonContainer>
        </W.Content>
    </W.Container>
    );
};
export default Write;