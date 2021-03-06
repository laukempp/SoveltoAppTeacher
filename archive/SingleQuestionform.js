import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import { postQuestion, postQuiz, getTags } from "../../service/Request";
import * as Yup from "yup";
import { uuid } from "uuidv4";
import ReactTags from "react-tag-autocomplete";
import socketIOClient from "socket.io-client";

const validationSchema = Yup.object().shape({
  question: Yup.string()
    .min(2, "Kysymyksen täytyy sisältää vähintään kaksi merkkiä.")
    .max(255, "Kysymys ei voi olla pidempi kuin 255 merkkiä.")
    .required("Kirjoita uusi kysymys."),
  correct_answer: Yup.string()
    .min(2, "Vastauksen täytyy sisältää vähintään kaksi merkkiä.")
    .max(255, "Vastaus ei voi olla pidempi kuin 255 merkkiä.")
    .required("Anna oikea vastaus"),
  wrong_answer: Yup.array()
    .min(1, "Vähintään yksi väärä vastaus.")
    .max(3, "Enintään kolme väärää vastausta")
    .required("Vähintään yksi väärä vastaus vaaditaan")
});

const SingleQuestionform = ({ topics }) => {
  const [tags, setTags] = useState([]);
  const [suggestions, setSuggestions] = useState();

  const handleDelete = i => {
    setTags(tags.filter((tag, index) => index !== i));
  };

  const handleAddition = tag => {
    tag["id"] = uuid();
    setTags(tags => [...tags, tag]);
  };

  const fetchData = () => {
    getTags().then(res => setSuggestions(res));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createTagArray = array => {
    let modified = array.map(item => item.name);
    return Object.values(modified);
  };

  const socket = socketIOClient("http://localhost:5001");

  const eventMessage = object => {
    return new Promise(resolve => {
      socket.emit("eventMessage", object);
      resolve();
    });
  };
  // Funktio, joka käsittelee quizin lähetyksen tietokantaan ja oppilaalle
  const handleSingleQuestionQuizSubmit = (question, istemporary) => {
    let data = {
      title: "popquiz",
      question_ids: [question],
      quiz_author: sessionStorage.getItem("badge"),
      quiz_badge: uuid(),
      istemporary: istemporary
    };
    postQuiz(data).then(() => eventMessage(data));
  };

  let topicInput = topics.map(option => {
    return <option key={option.id} value={option.id} label={option.title} />;
  });

  const initial = {
    question: "",
    correct_answer: "",
    wrong_answer: [""],
    topics_id: 1,
    q_tags: [],
    q_author: parseInt(sessionStorage.getItem("badge")),
    istemporary: 0,
    isSecondButton: false,
    isThirdButton: false
  };

  return (
    <div className="singleQuestionFormContainer">
      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          if (values.isFirstButton) {
            setSubmitting(true);
            values.q_tags = createTagArray(tags);
            postQuestion(values);
            resetForm();
            setTags([]);
            setSubmitting(false);
          }
          if (values.isSecondButton) {
            setSubmitting(true);
            values.q_tags = createTagArray(tags);
            postQuestion(values).then(res => {
              handleSingleQuestionQuizSubmit(
                res.id.toString(),
                values.istemporary
              );
            });
            resetForm();
            setTags([]);
            setSubmitting(false);
          }
          if (values.isThirdButton) {
            setSubmitting(true);
            values.q_tags = createTagArray(tags);
            postQuestion(values).then(res => {
              handleSingleQuestionQuizSubmit(
                res.id.toString(),
                values.istemporary
              );
            });
            resetForm();
            setTags([]);
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
          setFieldValue
        }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <div className="singleQuestionFormInput"></div>
              <Field
                type="text"
                name="question"
                id="question"
                placeholder="Kirjoita uusi kysymys"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.question}
                className={
                  touched.question && errors.question ? "has-error" : null
                }
              />
              <ErrorMessage
                component="div"
                name="question"
                className="invalidQuestion"
              />
              <Field
                as="select"
                name="topics_id"
                id="topic_id"
                className={
                  touched.topics_id && errors.topics_id ? "error" : null
                }
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.topics_id}
                style={{ display: "block" }}
              >
                {topicInput}
              </Field>
              <div>
                <ReactTags
                  tags={tags}
                  suggestions={suggestions}
                  onDelete={handleDelete}
                  onAddition={handleAddition}
                  allowNew={true}
                  placeholderText={"Lisää tägi"}
                />
              </div>
              <div>{/* <br /> */}</div>
              <Field
                type="text"
                name="correct_answer"
                id="correct_answer"
                placeholder="Oikea vastaus tähän"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.correct_answer}
                className={
                  touched.correct_answer && errors.correct_answer
                    ? "has-error"
                    : null
                }
              />
              <Field
                type="hidden"
                name="istemporary"
                id="istemporary"
                placeholder=""
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.istemporary}
              ></Field>
              <ErrorMessage
                component="div"
                name="correct_answer"
                className="invalidCorrectAnswer"
              />
              <div>{/* <br /> */}</div>
              <FieldArray
                className="wrongAns"
                name="wrong_answer"
                render={({ remove, push }) => (
                  <div className="wrongAns">
                    <label
                      className="wrongAnsLabel" /*  htmlFor={`wrong_answer.${one_wrong_answer}`} */
                    >
                      Väärät vastaukset
                    </label>
                    {values.wrong_answer && values.wrong_answer.length > -1 ? (
                      <div>
                        {values.wrong_answer.map((one_wrong_answer, index) => {
                          console.log(
                            "Yksi" +
                              one_wrong_answer +
                              " tämä on index " +
                              index
                          );
                          let btnDisabler = false;
                          if (index < 1) {
                            btnDisabler = true;
                          } else btnDisabler = false;
                          return (
                            <div className="row" id={index} key={index}>
                              <div className="col">
                                <Field
                                  type="text"
                                  className="wrongAnsInput"
                                  value={one_wrong_answer}
                                  name={`wrong_answer.${index}`}
                                  placeholder="Lisää uusi"
                                />
                                {errors.wrong_answer &&
                                  errors.wrong_answer[index] &&
                                  touched.wrong_answer &&
                                  touched.wrong_answer[index] && (
                                    <div className="wrongError">
                                      {errors.wrong_answer[index]}
                                    </div>
                                  )}
                              </div>
                              <div className="col">
                                <button
                                  disabled={btnDisabler}
                                  type="button"
                                  className="qFormRemoveBtn"
                                  onClick={() => remove(index)}
                                >
                                  X
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          className="secondary btnLogin"
                          onClick={() => push("")}
                        >
                          Lisää väärä vastaus
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="secondary btnLogin"
                        onClick={() => push("")}
                      >
                        Lisää väärä vastaus
                      </button>
                    )}
                  </div>
                )}
              />
              <br />

              <div className="input-row">
                <button
                  id="second-button"
                  className="btnLogin"
                  type="button"
                  onClick={e => {
                    setFieldValue("isSecondButton", true);
                    handleSubmit(e);
                  }}
                >
                  Tallenna kysymyspankkiin ja aloita tentti
                </button>
                <div>
                  <br />
                </div>
              </div>
              <div className="input-row">
                <button
                  id="third-button"
                  className="btnLogin"
                  type="button"
                  onClick={e => {
                    setFieldValue("isThirdButton", true);
                    setFieldValue("istemporary", 1);
                    handleSubmit(e);
                  }}
                >
                  Aloita tentti tallentamatta kysymystä
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default SingleQuestionform;
